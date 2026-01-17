import swaggerJsdoc from 'swagger-jsdoc';
import { SwaggerDefinition } from 'swagger-jsdoc';

const swaggerDefinition: SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Tibeb Skill Marketplace API',
    version: '1.0.0',
    description: 'RESTful API documentation for Tibeb Skill Marketplace Platform',
    contact: {
      name: 'Tibeb Team',
      email: 'support@tibeb.com',
    },
    license: {
      name: 'MIT',
    },
  },
  servers: [
    {
      url: `http://localhost:${process.env.PORT || 5000}`,
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token obtained from login endpoint',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          error: {
            type: 'string',
            example: 'Error message',
          },
        },
      },
      ValidationError: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          error: {
            type: 'string',
            example: 'Validation failed',
          },
          details: {
            type: 'array',
            items: {
              type: 'object',
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'clx1234567890',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          firstName: {
            type: 'string',
            example: 'John',
          },
          lastName: {
            type: 'string',
            example: 'Doe',
          },
          role: {
            type: 'string',
            enum: ['CLIENT', 'FREELANCER'],
            example: 'CLIENT',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['email', 'password', 'firstName', 'lastName', 'role'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          password: {
            type: 'string',
            minLength: 6,
            example: 'password123',
          },
          firstName: {
            type: 'string',
            example: 'John',
          },
          lastName: {
            type: 'string',
            example: 'Doe',
          },
          role: {
            type: 'string',
            enum: ['CLIENT', 'FREELANCER'],
            example: 'CLIENT',
            description: 'User role - cannot be changed after registration',
          },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'client1@example.com',
          },
          password: {
            type: 'string',
            example: 'password123',
          },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            type: 'object',
            properties: {
              user: {
                $ref: '#/components/schemas/User',
              },
              token: {
                type: 'string',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                description: 'JWT token for authentication',
              },
            },
          },
        },
      },
      UserResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            $ref: '#/components/schemas/User',
          },
        },
      },
      Job: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'clx1234567890',
          },
          title: {
            type: 'string',
            example: 'Website Redesign',
          },
          description: {
            type: 'string',
            example: 'I need a complete redesign of my website...',
          },
          budget: {
            type: 'number',
            nullable: true,
            example: 5000,
          },
          status: {
            type: 'string',
            enum: ['DRAFT', 'OPEN', 'CONTRACTED', 'IN_PROGRESS', 'COMPLETED'],
            example: 'OPEN',
          },
          clientId: {
            type: 'string',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
          client: {
            $ref: '#/components/schemas/User',
          },
          _count: {
            type: 'object',
            properties: {
              proposals: {
                type: 'number',
              },
            },
          },
        },
      },
      JobDetail: {
        allOf: [
          { $ref: '#/components/schemas/Job' },
          {
            type: 'object',
            properties: {
              proposals: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Proposal',
                },
              },
              contract: {
                $ref: '#/components/schemas/Contract',
                nullable: true,
              },
            },
          },
        ],
      },
      CreateJobRequest: {
        type: 'object',
        required: ['title', 'description'],
        properties: {
          title: {
            type: 'string',
            minLength: 1,
            maxLength: 200,
            example: 'Website Redesign',
          },
          description: {
            type: 'string',
            minLength: 10,
            example: 'I need a complete redesign of my e-commerce website...',
          },
          budget: {
            type: 'number',
            minimum: 0,
            example: 5000,
          },
        },
      },
      UpdateJobRequest: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            minLength: 1,
            maxLength: 200,
          },
          description: {
            type: 'string',
            minLength: 10,
          },
          budget: {
            type: 'number',
            minimum: 0,
          },
        },
      },
      Proposal: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'clx1234567890',
          },
          jobId: {
            type: 'string',
          },
          freelancerId: {
            type: 'string',
          },
          message: {
            type: 'string',
            example: 'I have 5+ years of experience...',
          },
          proposedAmount: {
            type: 'number',
            nullable: true,
            example: 4500,
          },
          status: {
            type: 'string',
            enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
            example: 'PENDING',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
          job: {
            $ref: '#/components/schemas/Job',
          },
          freelancer: {
            $ref: '#/components/schemas/User',
          },
        },
      },
      CreateProposalRequest: {
        type: 'object',
        required: ['jobId', 'message'],
        properties: {
          jobId: {
            type: 'string',
            example: 'clx1234567890',
          },
          message: {
            type: 'string',
            minLength: 10,
            example: 'I have extensive experience in this field...',
          },
          proposedAmount: {
            type: 'number',
            minimum: 0,
            example: 4500,
          },
        },
      },
      Contract: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'clx1234567890',
          },
          jobId: {
            type: 'string',
          },
          proposalId: {
            type: 'string',
          },
          clientId: {
            type: 'string',
          },
          freelancerId: {
            type: 'string',
          },
          status: {
            type: 'string',
            enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
            example: 'ACTIVE',
          },
          agreedAmount: {
            type: 'number',
            nullable: true,
            example: 4500,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
          completedAt: {
            type: 'string',
            format: 'date-time',
            nullable: true,
          },
        },
      },
      Message: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'clx1234567890',
          },
          jobId: {
            type: 'string',
            nullable: true,
            example: 'clx1234567890',
          },
          contractId: {
            type: 'string',
            nullable: true,
            example: 'clx1234567890',
          },
          senderId: {
            type: 'string',
          },
          receiverId: {
            type: 'string',
          },
          content: {
            type: 'string',
            example: 'Hello! I have a question about the project.',
          },
          isRead: {
            type: 'boolean',
            example: false,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          sender: {
            $ref: '#/components/schemas/User',
          },
          receiver: {
            $ref: '#/components/schemas/User',
          },
          job: {
            type: 'object',
            nullable: true,
            properties: {
              id: {
                type: 'string',
              },
              title: {
                type: 'string',
              },
            },
          },
        },
      },
      CreateMessageRequest: {
        type: 'object',
        required: ['jobId', 'receiverId', 'content'],
        properties: {
          jobId: {
            type: 'string',
            description: 'Job ID (for pre-contract messages)',
            example: 'clx1234567890',
          },
          contractId: {
            type: 'string',
            description: 'Contract ID (for post-contract messages)',
            example: 'clx1234567890',
          },
          receiverId: {
            type: 'string',
            description: 'ID of the message receiver',
            example: 'clx1234567890',
          },
          content: {
            type: 'string',
            minLength: 1,
            example: 'Hello! I have a question about the project.',
          },
        },
      },
      Notification: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'clx1234567890',
          },
          userId: {
            type: 'string',
          },
          type: {
            type: 'string',
            enum: ['message', 'proposal', 'proposal_accepted', 'job_status_change'],
            example: 'message',
          },
          title: {
            type: 'string',
            example: 'New Message',
          },
          message: {
            type: 'string',
            example: 'You have a new message from John Doe',
          },
          link: {
            type: 'string',
            nullable: true,
            example: '/messages/job123',
          },
          isRead: {
            type: 'boolean',
            example: false,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and registration endpoints',
    },
    {
      name: 'Jobs',
      description: 'Job management endpoints (CLIENT only for create/update/delete)',
    },
    {
      name: 'Proposals',
      description: 'Proposal management endpoints (FREELANCER for create, CLIENT for accept)',
    },
    {
      name: 'Messages',
      description: 'Messaging endpoints for job and contract communication',
    },
    {
      name: 'Notifications',
      description: 'Notification management endpoints',
    },
    {
      name: 'Health',
      description: 'Health check endpoint',
    },
  ],
};

const options = {
  definition: swaggerDefinition,
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options);

