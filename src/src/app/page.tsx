import { HeroSection } from "./components/HeroSection";
import { FeaturesSection } from "./components/FeatureSection";

export default function Home() {
  return (
    <main className="flex-1">
      <HeroSection />
      <FeaturesSection />
    </main>
  );
}
