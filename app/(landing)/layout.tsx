import CTA from "@/components/shadcn-space/blocks/cta-01/cta";
import Footer from "@/components/shadcn-space/blocks/footer-01/footer";
import Header, {
  NavigationSection,
} from "@/components/shadcn-space/blocks/hero-01/header";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const navigationData: NavigationSection[] = [
    {
      title: "Home",
      href: "/",
    },
    {
      title: "Listings",
      href: "/listing",
    },
    {
      title: "About Us",
      href: "/#about-us",
    },
    {
      title: "Features",
      href: "/#features",
    },
    {
      title: "Newsletter",
      href: "/#newsletter",
    },
  ];
  return (
    <div className="px-4">
      <Header navigationData={navigationData} />
      {children}
      <CTA/>
      <Footer />
    </div>
  );
}
