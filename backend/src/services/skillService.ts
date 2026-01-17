import { prisma } from '../config/database';
import { NotFoundError, ConflictError } from '../utils/errors';
import { AddSkillInput } from '../utils/validation';

/**
 * Get all skills for a user
 */
export async function getUserSkills(userId: string) {
  const userSkills = await prisma.userSkill.findMany({
    where: { userId },
    include: {
      skill: {
        select: {
          id: true,
          name: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return userSkills.map((us) => ({
    id: us.skill.id,
    name: us.skill.name,
    addedAt: us.createdAt,
  }));
}

/**
 * Add a skill to user's profile
 * Creates the skill if it doesn't exist, then links it to the user
 */
export async function addSkillToUser(userId: string, input: AddSkillInput) {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Normalize skill name (trim and capitalize first letter)
  const skillName = input.skillName.trim();
  const normalizedSkillName = skillName.charAt(0).toUpperCase() + skillName.slice(1).toLowerCase();

  // Find or create skill
  let skill = await prisma.skill.findUnique({
    where: { name: normalizedSkillName },
  });

  if (!skill) {
    skill = await prisma.skill.create({
      data: { name: normalizedSkillName },
    });
  }

  // Check if user already has this skill
  const existingUserSkill = await prisma.userSkill.findUnique({
    where: {
      userId_skillId: {
        userId,
        skillId: skill.id,
      },
    },
  });

  if (existingUserSkill) {
    throw new ConflictError('You already have this skill');
  }

  // Add skill to user
  await prisma.userSkill.create({
    data: {
      userId,
      skillId: skill.id,
    },
  });

  return {
    id: skill.id,
    name: skill.name,
  };
}

/**
 * Remove a skill from user's profile
 */
export async function removeSkillFromUser(userId: string, skillId: string) {
  // Check if user skill exists and belongs to user
  const userSkill = await prisma.userSkill.findUnique({
    where: {
      userId_skillId: {
        userId,
        skillId,
      },
    },
    include: {
      skill: true,
    },
  });

  if (!userSkill) {
    throw new NotFoundError('Skill not found in your profile');
  }

  // Remove the skill from user
  await prisma.userSkill.delete({
    where: {
      userId_skillId: {
        userId,
        skillId,
      },
    },
  });

  return {
    id: userSkill.skill.id,
    name: userSkill.skill.name,
  };
}

/**
 * Get all available skills (for autocomplete/search)
 */
export async function getAllSkills(search?: string) {
  const where = search
    ? {
        name: {
          contains: search,
          mode: 'insensitive' as const,
        },
      }
    : {};

  const skills = await prisma.skill.findMany({
    where,
    orderBy: {
      name: 'asc',
    },
    take: 50, // Limit results for autocomplete
  });

  return skills.map((skill) => ({
    id: skill.id,
    name: skill.name,
  }));
}

