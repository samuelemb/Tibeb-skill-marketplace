import { prisma } from '../config/database';
import { CreateJobInput, UpdateJobInput, UpdateJobStatusInput } from '../utils/validation';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';
import { JobStatus, UserRole, ContractStatus, JobCategory, Prisma } from '@prisma/client';
import { getPaidEscrowForJob, releaseEscrowForJob } from './paymentService';

export interface JobSearchFilters {
  status?: JobStatus;
  clientId?: string;
  category?: JobCategory;
  search?: string;
  minBudget?: number;
  maxBudget?: number;
  sortBy?: 'relevance' | 'date' | 'budget_asc' | 'budget_desc';
  page?: number;
  limit?: number;
}

export interface PaginatedJobsResult {
  jobs: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export async function createJob(clientId: string, input: CreateJobInput) {
  const job = await prisma.job.create({
    data: {
      title: input.title,
      description: input.description,
      budget: input.budget,
      category: input.category || JobCategory.OTHER,
      status: JobStatus.DRAFT,
      clientId,
    },
    include: {
      client: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return job;
}

/**
 * Enhanced job search with PostgreSQL full-text search
 * Uses tsvector for relevance ranking and fast searching
 */
export async function getJobs(filters?: JobSearchFilters): Promise<PaginatedJobsResult> {
  const page = filters?.page || 1;
  const limit = Math.min(filters?.limit || 20, 100); // Max 100 per page
  const skip = (page - 1) * limit;
  const effectiveStatus =
    filters?.status ?? (filters?.clientId ? undefined : JobStatus.OPEN);

  // Build where clause
  const where: Prisma.JobWhereInput = {};

  // Status filter
  if (effectiveStatus) {
    where.status = effectiveStatus;
  }

  // Category filter
  if (filters?.category) {
    where.category = filters.category;
  }

  // Client filter
  if (filters?.clientId) {
    where.clientId = filters.clientId;
  }

  if (!filters?.clientId) {
    where.isHidden = false;
  }

  // Budget range filter
  if (filters?.minBudget !== undefined || filters?.maxBudget !== undefined) {
    where.budget = {};
    if (filters.minBudget !== undefined) {
      where.budget.gte = filters.minBudget;
    }
    if (filters.maxBudget !== undefined) {
      where.budget.lte = filters.maxBudget;
    }
  }

  // Full-text search using PostgreSQL tsvector
  if (filters?.search) {
    const searchTerms = filters.search.trim();
    if (searchTerms) {
      // Use raw SQL for full-text search with ranking
      // This provides better relevance than simple contains
      where.OR = [
        {
          // Full-text search on search_vector (title + description)
          // Using raw SQL for ts_rank_cd ranking
        },
      ];

      // We'll use Prisma's raw query for full-text search with ranking
      // For now, fallback to contains if raw query not used
      // The actual full-text search will be done via raw SQL
    }
  }

  // Build orderBy clause
  let orderBy: Prisma.JobOrderByWithRelationInput[] = [];

  if (filters?.search && filters.sortBy === 'relevance') {
    // For relevance sorting, we need to use raw SQL
    // Will handle this in the query below
    orderBy = [{ createdAt: 'desc' }]; // Fallback
  } else {
    switch (filters?.sortBy) {
      case 'date':
        orderBy = [{ createdAt: 'desc' }];
        break;
      case 'budget_asc':
        orderBy = [{ budget: 'asc' }];
        break;
      case 'budget_desc':
        orderBy = [{ budget: 'desc' }];
        break;
      default:
        orderBy = [{ createdAt: 'desc' }];
    }
  }

  // If we have a search query, use raw SQL for full-text search with ranking
  if (filters?.search && filters.search.trim()) {
    const searchQuery = filters.search.trim();
    const searchTerms = searchQuery
      .split(/\s+/)
      .map(term => term.trim())
      .filter(term => term.length > 0)
      .map(term => `${term}:*`) // Prefix matching for better results
      .join(' & ');

    // Build the full query with full-text search
    const searchCondition = searchTerms
      ? `search_vector @@ plainto_tsquery('english', $1)`
      : '1=1';

    const whereConditions: string[] = [];
    const queryParams: any[] = [];

    if (searchTerms) {
      whereConditions.push(searchCondition);
      queryParams.push(searchQuery);
    }

    if (effectiveStatus) {
      whereConditions.push(`status = $${queryParams.length + 1}`);
      queryParams.push(effectiveStatus);
    }

    if (filters?.category) {
      whereConditions.push(`category = $${queryParams.length + 1}`);
      queryParams.push(filters.category);
    }

    if (filters?.clientId) {
      whereConditions.push(`"clientId" = $${queryParams.length + 1}`);
      queryParams.push(filters.clientId);
    }

    if (!filters?.clientId) {
      whereConditions.push(`"isHidden" = false`);
    }

    if (filters?.minBudget !== undefined) {
      whereConditions.push(`(budget IS NULL OR budget >= $${queryParams.length + 1})`);
      queryParams.push(filters.minBudget);
    }

    if (filters?.maxBudget !== undefined) {
      whereConditions.push(`(budget IS NULL OR budget <= $${queryParams.length + 1})`);
      queryParams.push(filters.maxBudget);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Count total results
    const countQuery = `
      SELECT COUNT(*)::int as count
      FROM jobs
      ${whereClause}
    `;
    const countResult = await prisma.$queryRawUnsafe<Array<{ count: number }>>(
      countQuery,
      ...queryParams
    );
    const total = countResult[0]?.count || 0;

    // Build ORDER BY clause
    let orderByClause = '';
    if (filters?.sortBy === 'relevance' && searchTerms) {
      orderByClause = `ORDER BY ts_rank_cd(search_vector, plainto_tsquery('english', $1)) DESC, "createdAt" DESC`;
    } else if (filters?.sortBy === 'date') {
      orderByClause = `ORDER BY "createdAt" DESC`;
    } else if (filters?.sortBy === 'budget_asc') {
      orderByClause = `ORDER BY budget ASC NULLS LAST, "createdAt" DESC`;
    } else if (filters?.sortBy === 'budget_desc') {
      orderByClause = `ORDER BY budget DESC NULLS LAST, "createdAt" DESC`;
    } else {
      orderByClause = `ORDER BY "createdAt" DESC`;
    }

    // Get paginated results with full-text search
    const jobsQuery = `
      SELECT 
        j.*,
        ts_rank_cd(j.search_vector, plainto_tsquery('english', $1)) as relevance,
        json_build_object(
          'id', u.id,
          'email', u.email,
          'firstName', u."firstName",
          'lastName', u."lastName"
        ) as client,
        (
          SELECT COUNT(*)::int
          FROM proposals p
          WHERE p."jobId" = j.id
        ) as proposal_count
      FROM jobs j
      INNER JOIN users u ON j."clientId" = u.id
      ${whereClause}
      ${orderByClause}
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    const jobsResult = await prisma.$queryRawUnsafe<any[]>(
      jobsQuery,
      ...queryParams,
      limit,
      skip
    );

    // Transform results to match expected format
    const jobs = jobsResult.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      budget: row.budget,
      status: row.status,
      clientId: row.clientId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      client: row.client,
      _count: {
        proposals: row.proposal_count || 0,
      },
      relevance: row.relevance ? parseFloat(row.relevance) : null,
    }));

    return {
      jobs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
    };
  }

  // Standard Prisma query for non-search cases
  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            proposals: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.job.count({ where }),
  ]);

  return {
    jobs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + limit < total,
    },
  };
}

export async function getJobById(jobId: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      client: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      proposals: {
        include: {
          freelancer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      contract: {
        include: {
          freelancer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      _count: {
        select: {
          proposals: true,
        },
      },
    },
  });

  if (!job) {
    throw new NotFoundError('Job not found');
  }

  return job;
}

export async function updateJob(jobId: string, userId: string, userRole: UserRole, input: UpdateJobInput) {
  // Only clients can update jobs
  if (userRole !== UserRole.CLIENT) {
    throw new ForbiddenError('Only clients can update jobs');
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new NotFoundError('Job not found');
  }

  // Only job owner can update
  if (job.clientId !== userId) {
    throw new ForbiddenError('You can only update your own jobs');
  }

  // Can only update if job is in DRAFT status or has no proposals
  if (job.status !== JobStatus.DRAFT) {
    const proposalCount = await prisma.proposal.count({
      where: { jobId },
    });

    if (proposalCount > 0) {
      throw new ValidationError('Cannot update job that has proposals. Only DRAFT jobs can be updated.');
    }
  }

  const updatedJob = await prisma.job.update({
    where: { id: jobId },
    data: {
      ...(input.title && { title: input.title }),
      ...(input.description && { description: input.description }),
      ...(input.budget !== undefined && { budget: input.budget }),
      ...(input.category && { category: input.category }),
    },
    include: {
      client: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return updatedJob;
}

export async function publishJob(jobId: string, userId: string, userRole: UserRole) {
  if (userRole !== UserRole.CLIENT) {
    throw new ForbiddenError('Only clients can publish jobs');
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new NotFoundError('Job not found');
  }

  if (job.clientId !== userId) {
    throw new ForbiddenError('You can only publish your own jobs');
  }

  if (job.status !== JobStatus.DRAFT) {
    throw new ValidationError('Only DRAFT jobs can be published');
  }

  const updatedJob = await prisma.job.update({
    where: { id: jobId },
    data: { status: JobStatus.OPEN },
    include: {
      client: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return updatedJob;
}

export async function updateJobStatus(jobId: string, userId: string, userRole: UserRole, input: UpdateJobStatusInput) {
  if (userRole !== UserRole.CLIENT) {
    throw new ForbiddenError('Only clients can update job status');
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new NotFoundError('Job not found');
  }

  if (job.clientId !== userId) {
    throw new ForbiddenError('You can only update your own jobs');
  }

  // Validate status transitions
  // Escrow workflow: OPEN → IN_PROGRESS (Escrow Deposit) → COMPLETED (Funds Released)
  const validTransitions: Record<JobStatus, JobStatus[]> = {
    [JobStatus.DRAFT]: [],
    [JobStatus.OPEN]: [],
    [JobStatus.CONTRACTED]: [JobStatus.IN_PROGRESS], // Escrow deposit phase
    [JobStatus.IN_PROGRESS]: [JobStatus.COMPLETED], // Funds release phase
    [JobStatus.COMPLETED]: [],
  };

  if (!validTransitions[job.status].includes(input.status)) {
    throw new ValidationError(
      `Invalid status transition from ${job.status} to ${input.status}`
    );
  }

  // Handle escrow deposit when moving to IN_PROGRESS
  if (input.status === JobStatus.IN_PROGRESS) {
    const contract = await prisma.contract.findUnique({
      where: { jobId },
      include: {
        job: true,
      },
    });

    if (!contract) {
      throw new ValidationError('Cannot move to IN_PROGRESS: Job must have an accepted contract');
    }

    const paidEscrow = await getPaidEscrowForJob(jobId);
    if (!paidEscrow) {
      throw new ValidationError('Escrow not funded. Please complete payment before starting work.');
    }
  }

  // Handle funds release when moving to COMPLETED
  if (input.status === JobStatus.COMPLETED) {
    const contract = await prisma.contract.findUnique({
      where: { jobId },
    });

    if (!contract) {
      throw new ValidationError('Cannot complete job: Job must have a contract');
    }

    // Ensure job is in IN_PROGRESS before completing
    if (job.status !== JobStatus.IN_PROGRESS) {
      throw new ValidationError('Job must be IN_PROGRESS before it can be completed');
    }

    await releaseEscrowForJob(jobId);

    await prisma.contract.update({
      where: { id: contract.id },
      data: {
        status: ContractStatus.COMPLETED,
        completedAt: new Date(),
      },
    });
  }

  const updatedJob = await prisma.job.update({
    where: { id: jobId },
    data: { status: input.status },
    include: {
      client: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return updatedJob;
}

export async function deleteJob(jobId: string, userId: string, userRole: UserRole) {
  if (userRole !== UserRole.CLIENT) {
    throw new ForbiddenError('Only clients can delete jobs');
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new NotFoundError('Job not found');
  }

  if (job.clientId !== userId) {
    throw new ForbiddenError('You can only delete your own jobs');
  }

  // Can only delete if DRAFT or has no proposals
  if (job.status !== JobStatus.DRAFT) {
    const proposalCount = await prisma.proposal.count({
      where: { jobId },
    });

    if (proposalCount > 0) {
      throw new ValidationError('Cannot delete job that has proposals');
    }
  }

  await prisma.job.delete({
    where: { id: jobId },
  });

  return { message: 'Job deleted successfully' };
}
