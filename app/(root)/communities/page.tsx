import CommunityCard from "@/components/cards/CommunityCard";
import UserCard from "@/components/cards/UserCard";
import { fetchCommunities } from "@/lib/actions/community.actions";
import { fetchUser, fetchUsers } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";

const Search = async () => {
  const user = await currentUser();
  if (!user) return null;
  const userInfo = await fetchUser(user.id);

  if (!userInfo?.onboarded) redirect("/onboarding");

  // Fetch Community
  const results = await fetchCommunities({
    searchString: "",
    pageSize: 20,
    pageNumber: 1,
  });

  return (
    <section>
      <h1 className="head-text mb-10">Community</h1>
      {/* SearchBar */}
      <div className="mt-14 flex flex-col gap-9">
        {results?.communities.length === 0 ? (
          <p className="no-reslut">No Result</p>
        ) : (
          <>
            {results?.communities.map((community) => (
              <CommunityCard
                id={community.id}
                key={community.id}
                name={community.name}
                username={community.username}
                imgUrl={community.image}
                bio={community.bio}
                members={community.members}
              />
            ))}
          </>
        )}
      </div>
    </section>
  );
};

export default Search;
