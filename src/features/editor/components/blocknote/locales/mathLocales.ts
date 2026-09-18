import { locales as mathLocales } from "@blocknote/math-block"

export type MathLocale = typeof mathLocales.en

const mathLocaleZh: MathLocale = {
  block: {
    add_source_text: "添加 LaTeX 公式",
    input_placeholder: "E = mc^2",
    preview_error_text: "公式无效（点击编辑）",
  },
  inline: {
    add_source_text: "添加 LaTeX 公式",
    input_placeholder: "E = mc^2",
    preview_error_text: "公式无效（点击编辑）",
  },
  slash_menu: {
    math_block: {
      title: "公式块",
      subtext: "独立的数学公式块",
      aliases: ["math", "latex", "formula", "equation"],
      group: "高级功能",
    },
    inline_math: {
      title: "行内公式",
      subtext: "文本中的数学符号",
      aliases: ["math", "latex", "formula", "equation"],
      group: "高级功能",
    },
  },
  block_type_select: { name: "公式" },
  exporter: {
    invalid_formula: (formula: string) => `无效公式 "${formula}"`,
  },
}

export function getMathLocale(lang: string): MathLocale {
  return lang.startsWith("zh") ? mathLocaleZh : mathLocales.en
}

// Re-export for backward compatibility
export { mathLocales }
