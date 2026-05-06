import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="font-display text-4xl font-bold mb-4">Zahlung erfolgreich!</h1>
        <p className="text-muted-foreground mb-8">Deine Bestellung wurde erfolgreich aufgegeben.</p>
        <Button onClick={() => navigate("/shop")}>Weiter shoppen</Button>
      </div>
      <Footer />
    </div>
  );
};

export default CheckoutSuccess;
