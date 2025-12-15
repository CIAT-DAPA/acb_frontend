"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { container, pageSubtitle, pageTitle } from "../components/ui";
import { Handshake } from "lucide-react";

// Tipos para los partners
interface Partner {
  name: string;
  logo: string;
  width: number;
  height: number;
}

interface CountryPartners {
  country: string;
  partners: Partner[];
}

// Datos de partners por país
const partnersData: CountryPartners[] = [
  {
    country: "Vietnam",
    partners: [
      {
        name: "Alliance of Bioversity International and CIAT",
        logo: "/assets/partners/guatemala/AllianceLogo.png",
        width: 200,
        height: 37,
      },
    ],
  },
  {
    country: "Guatemala",
    partners: [
      {
        name: "Alliance of Bioversity International and CIAT",
        logo: "/assets/partners/guatemala/AllianceLogo.png",
        width: 200,
        height: 37,
      },
      {
        name: "ICC",
        logo: "/assets/partners/guatemala/ICCLogo.png",
        width: 200,
        height: 37,
      },
      {
        name: "MAGA",
        logo: "/assets/partners/guatemala/magaLogo.png",
        width: 200,
        height: 37,
      },
    ],
  },
];

export default function PartnersPage() {
  const t = useTranslations("Partners");

  return (
    <main className="flex-1 ">
      {/* Header Section */}
      <section className="desk-texture desk-texture-strong bg-[#fefae0] py-10">
        <div className={container}>
          <div className="flex justify-between items-center">
            <div>
              <h1 className={pageTitle}>{t("title")}</h1>
              <p className={pageSubtitle}>{t("description")}</p>
            </div>
            <div className="hidden lg:block rotate-12">
              <Handshake
                width={150}
                height={319}
                className="object-contain drop-shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Partners by Country */}
      <section className="py-16">
        <div className={container}>
          <div className="space-y-16">
            {partnersData.map((countryData) => (
              <div key={countryData.country} className="space-y-8">
                {/* Country Title */}
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-[#283618] font-headers">
                    {countryData.country}
                  </h2>
                  <div className="mt-2 w-24 h-1 bg-[#ffaf68] mx-auto rounded-full"></div>
                </div>

                {/* Partners Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 items-center justify-items-center">
                  {countryData.partners.map((partner) => (
                    <div
                      key={partner.name}
                      className="group relative bg-white rounded-lg p-6 shadow-md hover:shadow-xl transition-all duration-300 flex items-center justify-center min-h-[140px] w-full border border-[#283618]/10 hover:border-[#ffaf68]/50"
                    >
                      <div className="relative flex items-center justify-center w-full h-full">
                        <Image
                          src={partner.logo}
                          alt={partner.name}
                          width={partner.width}
                          height={partner.height}
                          className="object-contain max-w-full max-h-[100px] transition-all duration-300"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
