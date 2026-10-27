import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/brand";
import { GearIcon, LogOutIcon, PlusIcon, SearchIcon, ShieldIcon, UserIcon } from "@/components/icons";
import { MainNav } from "@/components/main-nav";
import { Avatar } from "@/components/people";
import { UserMenu } from "@/components/user-menu";
import { getViewer } from "@/lib/auth";

export async function SiteHeader() {
  const viewer = await getViewer();
  const profile = viewer?.profile;

  return (
    <header className="site-header">
      <div className="container header-row">
        <Logo />
        <Suspense fallback={<nav aria-label="Main" className="main-nav" />}>
          <MainNav />
        </Suspense>
        <div className="header-actions">
          <form action="/browse" method="get" role="search" className="search">
            <label htmlFor="site-search" className="sr-only">
              Search clips
            </label>
            <SearchIcon size={17} />
            <input id="site-search" name="q" type="search" placeholder="Search clips, creators, zones" />
          </form>
          <Link href="/browse#search" className="btn btn-ghost btn-icon search-link" aria-label="Search">
            <SearchIcon size={18} />
          </Link>

          {profile ? (
            <UserMenu
              summary={
                <>
                  <Avatar name={profile.display_name} src={profile.avatar_url} size={36} />
                  <span className="user-name">{profile.display_name}</span>
                </>
              }
            >
              <span className="user-menu-title">{profile.display_name}</span>
              <Link href={`/u/${profile.username}`}>
                <UserIcon /> Your profile
              </Link>
              <Link href="/settings">
                <GearIcon /> Settings
              </Link>
              {viewer?.isCurator ? (
                <Link href="/admin">
                  <ShieldIcon /> Admin
                </Link>
              ) : null}
              <form action="/auth/signout" method="post">
                <button type="submit">
                  <LogOutIcon /> Log out
                </button>
              </form>
            </UserMenu>
          ) : (
            <Link href="/login" className="btn btn-ghost">
              Log in
            </Link>
          )}

          <Link href="/submit" className="btn btn-gold submit-btn">
            <PlusIcon />
            <span>
              Submit<span className="submit-rest"> a Clip</span>
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
