import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left side - Brand Image */}
      <div className="relative hidden w-1/2 lg:block">
        <img
          src="/images/store.jpg"
          alt="TEEKEH Store"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-charcoal/60" />
        <div className="relative flex h-full flex-col items-center justify-center">
          <h1 className="mb-2 text-6xl font-bold text-white">TEEKEH</h1>
          <p className="text-xl text-gray-300">Inventory Tracker</p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex w-full items-center justify-center bg-background p-8 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="text-3xl font-bold text-charcoal">
              TEEKEH
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
