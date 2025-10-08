import DashboardLayout from "@/components/DashboardLayout";
import SlidersSection from "./SlidersSection";
import CoverImagesSection from "./CoverImagesSection";

const Home = () => {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Home Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage homepage sliders and cover images
          </p>
        </div>

        {/* Sliders Section */}
        <SlidersSection />

        {/* Cover Images Section */}
        <CoverImagesSection />
      </div>
    </DashboardLayout>
  );
};

export default Home;
