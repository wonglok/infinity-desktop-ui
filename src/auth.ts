import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  pages: {
    signIn: "/", // redirect back to our LoginScreen
    error: "/", // show errors on the same screen
  },
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
});
