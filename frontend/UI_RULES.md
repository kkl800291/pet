# Admin UI Rules

后台管理台的列表页、表格和操作栏统一遵循以下规则。

## 表格

- 所有列表页优先使用 `src/components/AdminDataTable.vue`。
- 表格外层统一使用白底、`rounded-[2rem]`、浅边框和 `shadow-sm`。
- 表头统一为：
  - `text-xs`
  - `font-bold`
  - `uppercase`
  - `tracking-widest`
  - `text-on-surface-variant`
- 空态统一放在表格内部，占满整行，不单独在页面外重复提示。
- 表格行 hover 统一使用轻量高亮，不做跳动或缩放。

## 统计卡

- 顶部数据卡优先使用 `src/components/AdminStatCard.vue`。
- 只允许展示真实数据或真实派生数据。
- 颜色语义统一：
  - 常规信息：`default`
  - 重点主指标：`primary`
  - 正向状态：`success`
  - 风险状态：`danger`
  - 强强调卡：`solid`
- 不再在页面中手写一排结构相同的统计卡。

## 操作栏

- 所有表格中的“操作”列优先使用 `src/components/AdminTableActions.vue`。
- 操作按钮统一为固定宽度竖排：
  - 第一行图标
  - 第二行文字
- 单个按钮宽度统一，避免因文字长度不同导致列宽波动。
- 操作语义统一：
  - 查看类：`neutral`
  - 主操作：`primary`
  - 风险/破坏类：`danger`
- 不再在表格操作列中混用“纯图标按钮”和“横向文字按钮”。

## 页面按钮

- 返回列表按钮优先使用 `src/components/AdminBackButton.vue`。
- 页面级主按钮优先使用 `src/components/AdminActionButton.vue`。
- 不再在详情页里重复手写同一套主按钮、次按钮、危险按钮样式。

## 文案

- 不展示未接后端的假操作状态。
- 统计卡片只展示真实数据或真实派生数据，不写硬编码同比、效率、节省时长。
- 搜索、筛选、同步状态如果没有真实行为，不能伪装成可交互控件。

## 区块容器

- 具备相同外观的内容区块优先使用 `src/components/AdminPanel.vue`。
- 默认承担以下职责：
  - 白底卡片容器
  - 标题/副标题
  - 左侧图标头部
- 当区块只是在业务内容上不同，而容器结构一致时，不再在页面里重复写 `rounded-2xl bg-surface-container-lowest p-6 shadow-sm`。

## 新页面开发

- 新增列表页时，先复用表格组件、操作栏组件和统计卡组件，再补业务字段。
- 如果需要特殊操作样式，应先扩展组件能力，不要直接在页面里写一套新按钮。
- 如果页面区块外观一致但内容不同，优先扩展 `AdminPanel`，不要继续复制容器模板。
