import { redirect } from "next/navigation";

const Blog = () => {
  redirect("/coming-soon?from=blog");
};

export default Blog;
