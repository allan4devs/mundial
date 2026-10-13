import { ObjectId } from "mongodb";
import { getDb } from "@/lib/helpers/mongodb";
import { COLLECTIONS } from "@/lib/constants/db";
import type { UserPreferences } from "@/lib/types/index";
import { DEFAULT_USER_PREFERENCES } from "@/lib/constants/user";

export type { UserPreferences };
export { DEFAULT_USER_PREFERENCES };

export interface AppUser {
  _id?: ObjectId;
  email: string;
  name: string;
  passwordHash?: string;
  resetToken?: string | null;
  resetExpiry?: Date | null;
  auth0Sub?: string;
  image?: string;
  phone?: string;
  preferences?: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

function mergeUserPreferences(preferences?: Partial<UserPreferences> | null): UserPreferences {
  return {
    notifications: {
      ...DEFAULT_USER_PREFERENCES.notifications,
      ...(preferences?.notifications ?? {}),
    },
    dashboard: {
      ...DEFAULT_USER_PREFERENCES.dashboard,
      ...(preferences?.dashboard ?? {}),
    },
  };
}

async function getUsersCollection() {
  const db = await getDb();
  return db.collection<AppUser>(COLLECTIONS.USERS);
}

export async function findUserByEmail(email: string) {
  const users = await getUsersCollection();
  return users.findOne({ email: email.toLowerCase() });
}

export async function getUserPreferencesByEmail(email: string): Promise<UserPreferences | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;
  return mergeUserPreferences(user.preferences);
}

export async function updateUserPreferencesByEmail(
  email: string,
  preferences: UserPreferences
): Promise<UserPreferences | null> {
  const users = await getUsersCollection();
  const mergedPreferences = mergeUserPreferences(preferences);

  const result = await users.findOneAndUpdate(
    { email: email.toLowerCase() },
    {
      $set: {
        preferences: mergedPreferences,
        updatedAt: new Date(),
      },
    },
    {
      returnDocument: "after",
    }
  );

  if (!result) return null;
  return mergeUserPreferences(result.preferences);
}

export async function createCredentialsUser(input: {
  email: string;
  name: string;
  passwordHash: string;
}) {
  const users = await getUsersCollection();
  const now = new Date();
  const result = await users.insertOne({
    email: input.email.toLowerCase(),
    name: input.name,
    passwordHash: input.passwordHash,
    preferences: DEFAULT_USER_PREFERENCES,
    createdAt: now,
    updatedAt: now,
  });

  return users.findOne({ _id: result.insertedId });
}

export async function findUserByResetToken(token: string) {
  const users = await getUsersCollection();
  return users.findOne({ resetToken: token, resetExpiry: { $gt: new Date() } });
}

export async function setUserResetToken(id: string, token: string, expiry: Date) {
  const users = await getUsersCollection();
  return users.updateOne(
    { _id: new ObjectId(id) },
    { $set: { resetToken: token, resetExpiry: expiry, updatedAt: new Date() } }
  );
}

export async function clearUserResetToken(id: string) {
  const users = await getUsersCollection();
  return users.updateOne(
    { _id: new ObjectId(id) },
    { $set: { resetToken: null, resetExpiry: null, updatedAt: new Date() } }
  );
}

export async function updateUserPassword(id: string, passwordHash: string) {
  const users = await getUsersCollection();
  return users.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        passwordHash,
        updatedAt: new Date(),
      },
    }
  );
}

export async function updateUserPasswordByEmail(email: string, passwordHash: string) {
  const users = await getUsersCollection();
  return users.updateOne(
    { email: email.toLowerCase() },
    {
      $set: {
        passwordHash,
        updatedAt: new Date(),
      },
    }
  );
}

export type UserProfile = {
  name: string;
  email: string;
  phone: string;
};

export async function getUserProfileByEmail(email: string): Promise<UserProfile | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;

  return {
    name: user.name ?? "",
    email: user.email,
    phone: user.phone ?? "",
  };
}

export async function updateUserProfileByEmail(
  email: string,
  updates: { name: string; phone: string }
): Promise<UserProfile | null> {
  const users = await getUsersCollection();

  const result = await users.findOneAndUpdate(
    { email: email.toLowerCase() },
    {
      $set: {
        name: updates.name.trim(),
        phone: updates.phone.trim(),
        updatedAt: new Date(),
      },
    },
    {
      returnDocument: "after",
    }
  );

  if (!result) return null;

  return {
    name: result.name ?? "",
    email: result.email,
    phone: result.phone ?? "",
  };
}

export async function upsertUserFromAuth0(input: {
  auth0Sub?: string;
  email?: string;
  name?: string;
  image?: string;
}) {
  const users = await getUsersCollection();
  const now = new Date();

  if (input.auth0Sub) {
    const existingBySub = await users.findOne({ auth0Sub: input.auth0Sub });
    if (existingBySub) {
      const normalizedEmail = input.email?.toLowerCase();
      await users.updateOne(
        { _id: existingBySub._id },
        {
          $set: {
            email: normalizedEmail ?? existingBySub.email,
            name: input.name ?? existingBySub.name,
            image: input.image ?? existingBySub.image,
            preferences: mergeUserPreferences(existingBySub.preferences),
            updatedAt: now,
          },
        }
      );

      return users.findOne({ _id: existingBySub._id });
    }
  }

  if (!input.email) return null;

  const email = input.email.toLowerCase();

  const existing = await users.findOne({ email });
  if (existing) {
    await users.updateOne(
      { _id: existing._id },
      {
        $set: {
          auth0Sub: input.auth0Sub ?? existing.auth0Sub,
          name: input.name ?? existing.name,
          image: input.image ?? existing.image,
          preferences: mergeUserPreferences(existing.preferences),
          updatedAt: now,
        },
      }
    );

    return users.findOne({ _id: existing._id });
  }

  const result = await users.insertOne({
    email,
    name: input.name ?? email.split("@")[0],
    auth0Sub: input.auth0Sub,
    image: input.image,
    preferences: DEFAULT_USER_PREFERENCES,
    createdAt: now,
    updatedAt: now,
  });

  return users.findOne({ _id: result.insertedId });
}


export async function listUsers() {
  const users = await getUsersCollection();
  return users.find({}, { projection: { passwordHash: 0 } }).sort({ createdAt: -1 }).toArray();
}
