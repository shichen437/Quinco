import { useEffect, useState } from "react"

import { useTranslation } from "react-i18next"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  destructive?: boolean
  onConfirm: () => Promise<void>
  onSuccess?: () => void
  /** 需要用户输入确认值后才能操作，提供时显示输入框 */
  confirmValue?: string
  /** 输入框的占位文本 */
  confirmPlaceholder?: string
}

function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  cancelText,
  destructive = false,
  onConfirm,
  onSuccess,
  confirmValue,
  confirmPlaceholder,
}: ConfirmDialogProps) {
  const { t } = useTranslation("common")
  const [loading, setLoading] = useState(false)
  const [inputValue, setInputValue] = useState("")

  useEffect(() => {
    if (!open) {
      setInputValue("")
    }
  }, [open])

  const isConfirmDisabled = loading || (confirmValue != null && inputValue !== confirmValue)

  const handleConfirm = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isConfirmDisabled) return
    e.preventDefault()
    setLoading(true)
    try {
      await onConfirm()
      onOpenChange(false)
      onSuccess?.()
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>

        {confirmValue != null && (
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              confirmPlaceholder ?? t("confirmInputPlaceholder", { value: confirmValue })
            }
            disabled={loading}
            autoFocus
          />
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelText ?? t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            variant={destructive ? "destructive" : "default"}
            disabled={isConfirmDisabled}
            onClick={handleConfirm}
          >
            {confirmText ?? t("confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ConfirmDialog
