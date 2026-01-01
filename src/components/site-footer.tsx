export function SiteFooter() {
  return (
    <footer className="hidden md:block border-t py-6 text-center text-sm text-muted-foreground">
      <div className="container mx-auto px-4">
        <p>&copy; {new Date().getFullYear()} Ouno. All rights reserved.</p>
      </div>
    </footer>
  );
}
