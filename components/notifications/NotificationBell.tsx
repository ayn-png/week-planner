'use client';

import { Bell, BellOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useNotifications, type NotificationPermission } from '@/hooks/useNotifications';

function getBellState(permission: NotificationPermission) {
  switch (permission) {
    case 'granted':
      return { icon: Bell, className: 'text-primary', label: 'Reminders on' };
    case 'denied':
      return { icon: BellOff, className: 'text-destructive', label: 'Notifications blocked — enable in browser settings' };
    case 'unsupported':
      return null;
    default:
      return { icon: BellOff, className: 'text-muted-foreground', label: 'Enable reminders' };
  }
}

export function NotificationBell() {
  const { permission, requestPermission } = useNotifications();
  const state = getBellState(permission);

  if (!state) return null;

  const { icon: Icon, className, label } = state;

  return (
    <Tooltip>
      <TooltipTrigger render={<span />}>
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.9 }}
          onClick={permission === 'granted' ? undefined : requestPermission}
          aria-label={label}
          className={`flex h-9 w-9 min-h-[44px] min-w-[44px] md:h-7 md:w-7 md:min-h-0 md:min-w-0 items-center justify-center rounded-md hover:bg-muted transition-colors ${className}`}
        >
          <Icon className="h-3.5 w-3.5" />
        </motion.button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
