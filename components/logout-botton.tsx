import { LogOutIcon } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function LogOutButton() {
  const { logOut } = useAuth();
  return <Button onClick={logOut} variant="outline" className="mt-2">Logout <LogOutIcon className='h-4 w-4' />
  </Button>
}