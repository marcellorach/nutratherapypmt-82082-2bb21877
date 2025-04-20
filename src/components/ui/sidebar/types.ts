
import { VariantProps } from "class-variance-authority"
import { sheetVariants } from "./variants"

export type SidebarContext = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

export interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof import("@radix-ui/react-dialog").Content>,
    VariantProps<typeof sheetVariants> {}
