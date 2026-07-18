export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/((?!login|cadastro|api|_next/static|_next/image|favicon.ico).*)"],
};
