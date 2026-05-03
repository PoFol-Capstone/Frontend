export default function ProfilePage({ params }: { params: { id: string } }) {
  return (
    <main className="min-h-screen bg-white px-8 py-10">
      <h1 className="text-2xl font-bold">프로필 페이지</h1>
      <p className="mt-4 text-gray-500">유저 ID: {params.id}</p>
    </main>
  );
}