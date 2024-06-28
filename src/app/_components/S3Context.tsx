"use client";
import { ReactNode, createContext, useContext } from "react";
import { z } from "zod";

export type TS3Context = {
  isPublic: boolean;
  ssl: boolean;
  endpoint: string;
  bucketName: string;
  imageSizes?: number[];
};

export const S3Context = createContext<TS3Context>({
  isPublic: false,
  ssl: false,
  endpoint: "",
  bucketName: "",
  imageSizes: [128],
});

export function useS3Info() {
  return useContext(S3Context);
}

export function S3InfoProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: TS3Context;
}) {
  return <S3Context.Provider value={value}>{children}</S3Context.Provider>;
}
