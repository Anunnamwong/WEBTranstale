import NextAuth, { NextAuthOptions } from 'next-auth';
import ZitadelProvider from 'next-auth/providers/zitadel';

// Debug: Log when file is loaded
console.log('[NextAuth] Loading auth configuration...');

export const authOptions: NextAuthOptions = {
  providers: [
    ZitadelProvider({
      issuer: process.env.ZITADEL_ISSUER || 'https://webtalk.one',
      clientId: process.env.ZITADEL_CLIENT_ID || '',
      clientSecret: process.env.ZITADEL_CLIENT_SECRET || '',
      authorization: {
        params: {
          scope: 'openid email profile offline_access',
        },
      },
      checks: ['pkce', 'state'],
      async profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
        token.refreshToken = account.refresh_token;
      }
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as { id: string }).id = token.sub;
      }
      if (token.accessToken) {
        (session as { accessToken?: string }).accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login-zitadel',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  useSecureCookies: process.env.NODE_ENV === 'production',
};

const handler = NextAuth(authOptions);

// Debug: Log handler creation
console.log('[NextAuth] Handler created:', typeof handler);

export default handler;
