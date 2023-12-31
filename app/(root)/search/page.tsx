import UserCard from "@/components/cards/UserCard";
import Searchbar from "@/components/shared/SearchBar";
import { fetchUser, fetchUsers } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";

const Search = async (searchParams: { [key: string]: string | undefined }) => {
  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  //Fetch User

  const results = await fetchUsers({
    userId: user.id,
    searchString: searchParams.q,
    pageNumber: searchParams?.page ? +searchParams.page : 1,
    pageSize: 25,
  });

  return (
    <section>
      <h1 className="head-text mb-10">Search</h1>
      {/* SearchBar */}
      <Searchbar routeType="search" />

      <div className="mt-14 flex flex-col gap-9">
        {results?.users.length === 0 ? (
          <p className="no-reslut">No Result</p>
        ) : (
          <>
            {results?.users.map((user) => (
              <UserCard
                key={user.id}
                id={user.id}
                name={user.name}
                username={user.username}
                imgUrl={user.image}
                personType="User"
              />
            ))}
          </>
        )}
      </div>
    </section>
  );
};

export default Search;
