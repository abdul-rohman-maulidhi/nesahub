import { getUserByUsername } from "@/services/user";

import { UserProfilePage } from "@/components/user-profile/user-profile-page";
import { NotFoundSection } from "@/components/commons/navigations/social/not-found-section";

export default async function UserPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  try {
    const user = await getUserByUsername({ username });

    if (user) {
      return <UserProfilePage username={username} tab="reposts" />;
    } else {
      return (
        <NotFoundSection
          page="User"
          title="User not found"
          description="The user you are looking for does not exist."
        />
      );
    }
  } catch (error) {
    return (
      <NotFoundSection
        page="User"
        title="Failed getting user data"
        description="An error occurred while trying to get the user data."
      />
    );
  }
}
