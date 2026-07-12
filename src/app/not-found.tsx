import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="text-3xl font-bold">Sidan hittades inte</h1>
      <p className="mt-3 text-muted">
        Sidan du letar efter finns inte eller har flyttats.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-lg bg-primary px-5 py-2.5 font-semibold text-white hover:bg-primary-dark"
      >
        Till startsidan
      </Link>
    </div>
  );
}
