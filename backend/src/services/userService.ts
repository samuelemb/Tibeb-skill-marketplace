import { prisma } from '../config/database';
import { NotFoundError, ValidationError } from '../utils/errors';
import { UpdateClientSetupInput, UpdateFreelancerSetupInput } from '../utils/validation';

const allowedLanguages = new Set(['en', 'am', 'om', 'ti']);
const allowedThemes = new Set(['light', 'dark']);

export async function getPublicUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        role: true,
        clientCompanyName: true,
        headline: true,
        location: true,
        hourlyRate: true,
        bio: true,
        emailVerified: true,
        createdAt: true,
        clientIndustryPreferences: {
          select: {
            industry: true,
          },
        },
        skills: {
          select: {
            skill: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const skills = user.skills.map((entry) => entry.skill.name);
  const industries = user.clientIndustryPreferences.map((entry) => entry.industry);

  let freelancerStats:
    | {
        totalJobs: number;
        completedJobs: number;
        successRate: number;
      }
    | undefined;

  if (user.role === 'FREELANCER') {
    const [totalJobs, completedJobs] = await Promise.all([
      prisma.contract.count({
        where: {
          freelancerId: userId,
        },
      }),
      prisma.contract.count({
        where: {
          freelancerId: userId,
          status: 'COMPLETED',
        },
      }),
    ]);

    freelancerStats = {
      totalJobs,
      completedJobs,
      successRate: totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0,
    };
  }

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
    role: user.role,
    companyName: user.clientCompanyName,
    headline: user.headline,
    location: user.location,
    hourlyRate: user.hourlyRate,
    bio: user.bio,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    skills,
    industries,
    freelancerStats,
  };
}

export async function getUserPreferences(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      language: true,
      theme: true,
      pushNewMessages: true,
      pushProjectUpdates: true,
      pushPaymentAlerts: true,
      pushMarketing: true,
      emailNewMessages: true,
      emailProjectUpdates: true,
      emailPaymentAlerts: true,
      emailMarketing: true,
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
}

type UpdateUserPreferencesInput = {
  language?: string;
  theme?: string;
  pushNewMessages?: boolean;
  pushProjectUpdates?: boolean;
  pushPaymentAlerts?: boolean;
  pushMarketing?: boolean;
  emailNewMessages?: boolean;
  emailProjectUpdates?: boolean;
  emailPaymentAlerts?: boolean;
  emailMarketing?: boolean;
};

export async function updateUserPreferences(
  userId: string,
  input: UpdateUserPreferencesInput
) {
  const data: UpdateUserPreferencesInput = {};

  if (typeof input.language === 'string') {
    const normalizedLanguage = input.language.trim().toLowerCase();
    if (!allowedLanguages.has(normalizedLanguage)) {
      throw new ValidationError('Invalid language. Allowed values: en, am, om, ti');
    }
    data.language = normalizedLanguage;
  }
  if (typeof input.theme === 'string') {
    const normalizedTheme = input.theme.trim().toLowerCase();
    if (!allowedThemes.has(normalizedTheme)) {
      throw new ValidationError('Invalid theme. Allowed values: light, dark');
    }
    data.theme = normalizedTheme;
  }

  const booleanKeys: Array<keyof Omit<UpdateUserPreferencesInput, 'language' | 'theme'>> = [
    'pushNewMessages',
    'pushProjectUpdates',
    'pushPaymentAlerts',
    'pushMarketing',
    'emailNewMessages',
    'emailProjectUpdates',
    'emailPaymentAlerts',
    'emailMarketing',
  ];

  for (const key of booleanKeys) {
    if (typeof input[key] === 'boolean') {
      data[key] = input[key];
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      language: true,
      theme: true,
      pushNewMessages: true,
      pushProjectUpdates: true,
      pushPaymentAlerts: true,
      pushMarketing: true,
      emailNewMessages: true,
      emailProjectUpdates: true,
      emailPaymentAlerts: true,
      emailMarketing: true,
    },
  });

  return user;
}

export async function getFreelancerSetup(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      headline: true,
      bio: true,
      hourlyRate: true,
      experienceLevel: true,
      availability: true,
      profileSetupCompleted: true,
      profileSetupCompletedAt: true,
      externalLinks: {
        select: {
          id: true,
          title: true,
          url: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
}

export async function updateFreelancerSetup(userId: string, input: UpdateFreelancerSetupInput) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (input.links) {
    for (const link of input.links) {
      if (!/^https?:\/\//i.test(link.url)) {
        throw new ValidationError('External link URLs must start with http:// or https://');
      }
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        ...(input.headline !== undefined && { headline: input.headline }),
        ...(input.bio !== undefined && { bio: input.bio }),
        ...(input.hourlyRate !== undefined && { hourlyRate: input.hourlyRate }),
        ...(input.experienceLevel !== undefined && { experienceLevel: input.experienceLevel }),
        ...(input.availability !== undefined && { availability: input.availability }),
      },
      select: {
        id: true,
        headline: true,
        bio: true,
        hourlyRate: true,
        experienceLevel: true,
        availability: true,
        profileSetupCompleted: true,
        profileSetupCompletedAt: true,
      },
    });

    if (input.links) {
      await tx.freelancerExternalLink.deleteMany({
        where: { userId },
      });

      if (input.links.length > 0) {
        await tx.freelancerExternalLink.createMany({
          data: input.links.map((link) => ({
            userId,
            title: link.title,
            url: link.url,
          })),
        });
      }
    }

    const links = await tx.freelancerExternalLink.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        url: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      ...updatedUser,
      externalLinks: links,
    };
  });

  return result;
}

export async function completeFreelancerSetup(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      headline: true,
      bio: true,
      hourlyRate: true,
      experienceLevel: true,
      availability: true,
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (!user.headline || !user.bio || !user.hourlyRate || !user.experienceLevel || !user.availability) {
    throw new ValidationError(
      'Profile setup is incomplete. Required fields: headline, bio, hourlyRate, experienceLevel, availability.'
    );
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      profileSetupCompleted: true,
      profileSetupCompletedAt: new Date(),
    },
    select: {
      id: true,
      profileSetupCompleted: true,
      profileSetupCompletedAt: true,
    },
  });

  return updated;
}

export async function getClientSetup(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      clientCompanyName: true,
      bio: true,
      clientFocus: true,
      clientPhone: true,
      clientWebsite: true,
      clientSetupCompleted: true,
      clientSetupCompletedAt: true,
      clientIndustryPreferences: {
        select: {
          industry: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return {
    id: user.id,
    companyName: user.clientCompanyName,
    shortBio: user.bio,
    industries: user.clientIndustryPreferences.map((item) => item.industry),
    focus: user.clientFocus,
    phone: user.clientPhone,
    website: user.clientWebsite,
    clientSetupCompleted: user.clientSetupCompleted,
    clientSetupCompletedAt: user.clientSetupCompletedAt,
  };
}

export async function updateClientSetup(userId: string, input: UpdateClientSetupInput) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        ...(input.companyName !== undefined && { clientCompanyName: input.companyName }),
        ...(input.shortBio !== undefined && { bio: input.shortBio }),
        ...(input.focus !== undefined && { clientFocus: input.focus }),
        ...(input.phone !== undefined && { clientPhone: input.phone }),
        ...(input.website !== undefined && { clientWebsite: input.website || null }),
      },
      select: {
        id: true,
        clientCompanyName: true,
        bio: true,
        clientFocus: true,
        clientPhone: true,
        clientWebsite: true,
        clientSetupCompleted: true,
        clientSetupCompletedAt: true,
      },
    });

    if (input.industries) {
      await tx.clientIndustryPreference.deleteMany({
        where: { userId },
      });
      await tx.clientIndustryPreference.createMany({
        data: input.industries.map((industry) => ({
          userId,
          industry,
        })),
      });
    }

    const industries = await tx.clientIndustryPreference.findMany({
      where: { userId },
      select: { industry: true },
      orderBy: { createdAt: 'asc' },
    });

    return {
      id: updatedUser.id,
      companyName: updatedUser.clientCompanyName,
      shortBio: updatedUser.bio,
      industries: industries.map((item) => item.industry),
      focus: updatedUser.clientFocus,
      phone: updatedUser.clientPhone,
      website: updatedUser.clientWebsite,
      clientSetupCompleted: updatedUser.clientSetupCompleted,
      clientSetupCompletedAt: updatedUser.clientSetupCompletedAt,
    };
  });

  return result;
}

export async function completeClientSetup(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      clientCompanyName: true,
      bio: true,
      clientFocus: true,
      clientPhone: true,
      clientIndustryPreferences: {
        select: { industry: true },
      },
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (
    !user.clientCompanyName ||
    !user.bio ||
    !user.clientFocus ||
    !user.clientPhone ||
    user.clientIndustryPreferences.length === 0
  ) {
    throw new ValidationError(
      'Client setup is incomplete. Required fields: companyName, shortBio, industries, focus, phone.'
    );
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      clientSetupCompleted: true,
      clientSetupCompletedAt: new Date(),
    },
    select: {
      id: true,
      clientSetupCompleted: true,
      clientSetupCompletedAt: true,
    },
  });

  return updated;
}
