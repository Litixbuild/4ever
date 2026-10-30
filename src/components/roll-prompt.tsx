import { ClassPicker } from "@/components/class-picker";
import { getViewer } from "@/lib/auth";

// Logged-in visitors get the class picker. It opens by itself only for someone who hasn't
// picked a class and hasn't been shown it yet (a first login); otherwise it waits to be opened.
export async function RollPrompt() {
  const viewer = await getViewer();
  const profile = viewer?.profile;
  if (!profile) return null;
  const firstTime = !profile.main_class && !profile.class_prompted_at;
  return <ClassPicker name={profile.display_name} autoOpen={firstTime} />;
}
