
import React from "react";
import { getFileIconConfig } from "@/utils/file-utils";

interface FileIconProps {
  extension: string;
}

const FileIcon: React.FC<FileIconProps> = ({ extension }) => {
  const { icon: IconComponent, color } = getFileIconConfig(extension);
  return <IconComponent className={color} />;
};

export default FileIcon;
