// src/app/layout.tsx\
import "@/styles/globals.css"
export const metadata = {
    title: "Aptia Answers",
    description: "A simple Next.js app",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className="min-h-screen bg-gray-100">
                {children}
            </body>
        </html>
    );
}
