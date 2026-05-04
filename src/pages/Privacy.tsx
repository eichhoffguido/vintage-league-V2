import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Privacy = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <h1 className="mb-8 text-4xl font-bold">Datenschutzerklärung</h1>

          <div className="mt-8 p-6 border border-border rounded-sm bg-secondary/30">
            <p className="text-muted-foreground text-center">Diese Seite wird noch befüllt</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
