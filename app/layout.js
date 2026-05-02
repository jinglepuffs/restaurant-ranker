import './globals.css';

export const metadata = {
  title: 'The Foodiotic Table',
  description: 'Our collaborative restaurant rankings',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
