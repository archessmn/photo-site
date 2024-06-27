"use client";

import { AppShell, Burger, Group, NavLink } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { ThemeSwitcher } from "../theme-switcher";
import { LuBook, LuCalendar, LuHome, LuUpload, LuWrench } from "react-icons/lu";
import { IoMdPhotos } from "react-icons/io";
import { usePathname } from "next/navigation";
import Link from "next/link";

export function GenericAppShell(props: { children: React.ReactNode }) {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
  const pathname = usePathname();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger
            opened={mobileOpened}
            onClick={toggleMobile}
            hiddenFrom="sm"
            size="sm"
          />
          <Burger
            opened={desktopOpened}
            onClick={toggleDesktop}
            visibleFrom="sm"
            size="sm"
          />
          <div>Logo</div>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <NavLink
          component={Link}
          href={"/"}
          leftSection={<LuHome size="1rem" />}
          label="Home"
          onClick={toggleMobile}
          active={pathname === "/"}
        />
        <NavLink
          component={Link}
          href={"/upload"}
          leftSection={<LuUpload size="1rem" />}
          label="Upload Photo"
          onClick={toggleMobile}
          active={pathname === "/upload"}
        />
        <NavLink
          component={Link}
          href={"/photos"}
          leftSection={<IoMdPhotos size="1rem" />}
          label="View Photos"
          onClick={toggleMobile}
          active={pathname === "/photos"}
        />
        <ThemeSwitcher className={"mt-auto"} />
      </AppShell.Navbar>

      <AppShell.Main>{props.children}</AppShell.Main>
    </AppShell>
  );
}
