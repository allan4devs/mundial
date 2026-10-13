// app/(page_routes)/platform/page.tsx
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import AuthLanding from '@/app/components/auth/AuthLanding';

export default async function LoginPage() {
    const session = await auth();

    if (session?.user) {
        redirect('/booking');
    }

    return <AuthLanding />;
}