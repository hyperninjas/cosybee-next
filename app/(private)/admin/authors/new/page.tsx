import AuthorForm from "../AuthorForm";

export default function NewAuthorPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">New author</h1>
      <AuthorForm />
    </div>
  );
}
