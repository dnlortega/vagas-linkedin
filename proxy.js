import { withAuth } from "next-auth/middleware";

export const proxy = withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: ["/((?!$|login|cadastro|api|_next/static|_next/image|favicon.ico|manifest.json|icon-192.png|icon-512.png).*)"],
};
