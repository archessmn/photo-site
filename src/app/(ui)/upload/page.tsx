"use client";

import { Button, Group, Box, FileInput, Center } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { z } from "zod";
import { zodResolver } from "mantine-form-zod-resolver";
import { api } from "@/trpc/react";
import { useState } from "react";

export default function UploadPage() {
  return <PictureUploadForm />;
}

function PictureUploadForm() {
  const form = useForm({
    initialValues: {
      file: null,
    },

    validate: zodResolver(
      z.object({
        file: z.any(),
      }),
    ),
  });

  const [value, setValue] = useState<File | null>(null);
  const createPresignedUrlToUpload =
    api.storage.createPresignedUrlToUpload.useMutation();

  const updateFileOnceUploaded =
    api.storage.updateFileOnceUploaded.useMutation();

  return (
    <Box maw={680} mx="auto">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (form.validate().hasErrors) {
            notifications.show({
              title: "Uh oh",
              message: "Something went wrong",
              color: "red",
            });
          }
          if (value?.name) {
            const orientation = await getImageOrientation(value);

            console.log(orientation);

            const presignedUrlResponse =
              await createPresignedUrlToUpload.mutateAsync({
                fileName: value.name,
                orientation,
              });

            const presignedUrl = presignedUrlResponse.url;

            const fileUploadResponse = await fetch(presignedUrl, {
              method: "PUT",
              body: value,
              headers: {
                "Content-Type": value.type,
                "Access-Control-Allow-Origin": "*",
              },
            });

            console.log("Uploaded");

            if (fileUploadResponse.status == 200) {
              const updateUploadResponse =
                await updateFileOnceUploaded.mutateAsync({
                  id: presignedUrlResponse.id,
                  success: true,
                  size: value.size,
                });

              notifications.show({
                title: "Success",
                message: "File Uploaded",
                color: "green",
              });
            } else {
              const updateUploadResponse =
                await updateFileOnceUploaded.mutateAsync({
                  id: presignedUrlResponse.id,
                  success: false,
                });

              notifications.show({
                title: "Uh oh",
                message: "Something went wrong",
                color: "red",
              });
            }
          }
        }}
      >
        <FileInput
          label="File"
          value={value}
          accept="image/png,image/jpeg"
          onChange={async (payload) => {
            setValue(payload);
          }}
        />

        <Group justify="flex-end" mt="md">
          <Button type="submit">Submit</Button>
        </Group>
      </form>
    </Box>
  );
}

function getImageOrientation(image: File) {
  return new Promise<"square" | "landscape" | "portrait">((resolve, reject) => {
    var fr = new FileReader();

    fr.onload = function () {
      // file is loaded
      var img = new Image();

      img.onload = function () {
        console.log("Resolving!!");

        if (img.width == img.height) resolve("square");

        resolve(img.width > img.height ? "landscape" : "portrait"); // image is loaded; sizes are available
      };

      if (!fr.result) {
        return reject();
      }

      img.src = fr.result!.toString(); // is the data URL because called with readAsDataURL
    };

    fr.readAsDataURL(image);
  });
}
