import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-xl space-y-5 p-8">
      <h1 className="text-2xl font-bold">شركة التضامن للتامين التجاري</h1>
      <p>بوابة الموارد البشرية</p>
      <Link href="/login/" className="underline">تسجيل الدخول</Link>
    </main>
  );
}
