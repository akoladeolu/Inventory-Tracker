import Link from "next/link";
import { AuthSlideshow } from "@/features/auth/components/auth-slideshow";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left side - Brand Image Slideshow */}
      <div className="relative hidden w-1/2 lg:block">
        <AuthSlideshow />
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
