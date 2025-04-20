
import React from "react";

// Imagem enviada pelo usuário (ajuste path se necessário)
const logoUrl = "/lovable-uploads/154ca2f9-5d6b-4a91-a708-3c8bd2356c0d.png";

const SciSpaceLogo: React.FC<{ className?: string }> = ({ className }) => (
  <img src={logoUrl} alt="Logo SciSpace" className={className || "h-14 w-auto rounded-md shadow border"} />
);

export default SciSpaceLogo;
