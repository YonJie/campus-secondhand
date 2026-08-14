/**
 * 临时脚本：生成《校园二手交易平台详细设计说明书》
 * 用完即删，不写入 package.json。
 */
const fs = require("fs");
const path = require("path");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  Header,
  Footer,
  PageNumber,
  WidthType,
  ShadingType,
  BorderStyle,
  VerticalAlign,
  AlignmentType,
  HeadingLevel,
  TableOfContents,
  PageBreak,
  VerticalMergeType,
} = require("docx");

const FONT = "Microsoft YaHei";
const INK = "1E2A38";
const MINT = "2FB88B";
const GRAY = "F3F4F6";
const LINE = "DBDCD3";
const INK_SOFT = "5C6672";
const WHITE = "FFFFFF";
const PAGE_W = 11906;
const MARGIN = 1440;
const CONTENT_W = 9026;
const LOGIC_COL1 = 2400;
const LOGIC_COL2 = 6626;

const thin = { style: BorderStyle.SINGLE, size: 4, color: LINE };
const cellBorders = { top: thin, bottom: thin, left: thin, right: thin };
const noBorder = {
  style: BorderStyle.NONE,
  size: 0,
  color: "FFFFFF",
};
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

/**
 * @param {string} text
 * @param {object} [opt]
 */
function run(text, opt = {}) {
  return new TextRun({
    text: text == null ? "" : String(text),
    font: FONT,
    size: opt.size ?? 20,
    bold: Boolean(opt.bold),
    color: opt.color || INK,
    italics: Boolean(opt.italics),
  });
}

/**
 * @param {string|string[]} text
 * @param {object} [opt]
 */
function p(text, opt = {}) {
  const lines = Array.isArray(text) ? text : [text];
  return new Paragraph({
    spacing: {
      line: 360,
      lineRule: "auto",
      before: opt.before ?? 0,
      after: opt.after ?? 80,
    },
    alignment: opt.align,
    border: opt.border,
    shading: opt.shading,
    children: lines.map((t, i) => {
      const r = run(t, { size: opt.size, bold: opt.bold, color: opt.color, italics: opt.italics });
      return i === 0 ? r : r;
    }),
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { line: 360, lineRule: "auto", before: 360, after: 160 },
    border: {
      left: { style: BorderStyle.SINGLE, size: 18, color: MINT, space: 8 },
    },
    children: [run(text, { size: 20, bold: true, color: INK })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { line: 360, lineRule: "auto", before: 280, after: 120 },
    children: [run(text, { size: 20, bold: true, color: INK })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { line: 360, lineRule: "auto", before: 240, after: 100 },
    children: [run(text, { size: 20, bold: true, color: INK })],
  });
}

function frontTitle(text) {
  return new Paragraph({
    spacing: { line: 360, lineRule: "auto", before: 200, after: 160 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 12, color: MINT },
    },
    children: [run(text, { size: 20, bold: true, color: INK })],
  });
}

function labelP(text) {
  return new Paragraph({
    spacing: { line: 360, lineRule: "auto", before: 160, after: 80 },
    children: [run(text, { size: 20, bold: true, color: INK })],
  });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

/**
 * @param {number} width
 * @param {Paragraph[]} children
 * @param {object} [opt]
 */
function cell(width, children, opt = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    borders: opt.borders || cellBorders,
    shading: opt.fill
      ? { type: ShadingType.CLEAR, fill: opt.fill, color: opt.fill }
      : undefined,
    verticalAlign: opt.valign || VerticalAlign.TOP,
    columnSpan: opt.span,
    children: children.length ? children : [p("", { size: opt.size || 20 })],
  });
}

function headerCell(width, text, opt = {}) {
  return cell(
    width,
    [
      new Paragraph({
        spacing: { line: 276, lineRule: "auto", after: 0 },
        children: [run(text, { size: opt.size || 18, bold: true, color: WHITE })],
      }),
    ],
    { fill: INK, valign: VerticalAlign.CENTER },
  );
}

function bodyCell(width, textOrParas, opt = {}) {
  const size = opt.size || 20;
  const paras = Array.isArray(textOrParas)
    ? textOrParas.map((t) =>
        t instanceof Paragraph
          ? t
          : new Paragraph({
              spacing: { line: 360, lineRule: "auto", after: 40 },
              children: [run(String(t), { size, bold: opt.bold, color: opt.color || INK })],
            }),
      )
    : [
        new Paragraph({
          spacing: { line: 360, lineRule: "auto", after: 0 },
          children: [run(String(textOrParas), { size, bold: opt.bold, color: opt.color || INK })],
        }),
      ];
  return cell(width, paras, { fill: opt.fill, valign: opt.valign || VerticalAlign.TOP });
}

/**
 * @param {number[]} widths
 * @param {string[]} headers
 * @param {(string|string[]|Paragraph[])[][]} rows
 * @param {object} [opt]
 */
function makeTable(widths, headers, rows, opt = {}) {
  const size = opt.size || 20;
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => headerCell(widths[i], h, { size })),
  });
  const dataRows = rows.map((row) => {
    return new TableRow({
      children: row.map((val, i) => {
        const isFirst = i === 0 && opt.shadeFirst;
        return bodyCell(widths[i], val, {
          size,
          fill: isFirst ? GRAY : undefined,
          bold: isFirst,
        });
      }),
    });
  });
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: widths,
    rows: [headerRow, ...dataRows],
  });
}

/**
 * 逻辑说明两列表。固定 7 行。
 * @param {{ item: string, lines: string[] }[]} rows
 */
function logicTable(rows) {
  const header = new TableRow({
    tableHeader: true,
    children: [
      headerCell(LOGIC_COL1, "项目", { size: 16 }),
      headerCell(LOGIC_COL2, "说明", { size: 16 }),
    ],
  });
  const data = rows.map((r) => {
    const lines = r.lines.length ? r.lines : ["无"];
    return new TableRow({
      children: [
        cell(
          LOGIC_COL1,
          [
            new Paragraph({
              spacing: { line: 360, lineRule: "auto", after: 0 },
              children: [run(r.item, { size: 16, bold: true, color: INK })],
            }),
          ],
          { fill: GRAY, valign: VerticalAlign.CENTER },
        ),
        cell(
          LOGIC_COL2,
          lines.map(
            (t) =>
              new Paragraph({
                spacing: { line: 360, lineRule: "auto", after: 40 },
                children: [run(t, { size: 16, color: INK })],
              }),
          ),
        ),
      ],
    });
  });
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [LOGIC_COL1, LOGIC_COL2],
    rows: [header, ...data],
  });
}

function codeBlock(lines) {
  return lines.map(
    (t) =>
      new Paragraph({
        spacing: { line: 276, lineRule: "auto", after: 0 },
        shading: { type: ShadingType.CLEAR, fill: GRAY, color: GRAY },
        children: [run(t, { size: 16, color: INK })],
      }),
  );
}

function spacer() {
  return new Paragraph({ spacing: { after: 120 }, children: [] });
}

function featureBlock(title, uiLines, logicRows, extra = []) {
  return [h3(title), labelP("【界面】"), ...uiLines.map((t) => p(t)), labelP("【逻辑说明】"), logicTable(logicRows), spacer(), ...extra];
}

function fieldTable(rows) {
  const w = [1800, 1400, 1000, 4826];
  return makeTable(w, ["字段", "类型", "必填", "说明"], rows, { size: 16 });
}

const FAIL_JSON = [
  "{",
  '  "success": false,',
  '  "data": null,',
  '  "message": "错误说明"',
  "}",
];

const LOGIN_JSON = [
  "{",
  '  "success": true,',
  '  "data": {',
  '    "token": "<jwt>",',
  '    "user": { "id": "<uuid>", "username": "alice", "avatarUrl": null, "createdAt": "2026-07-29T02:00:00.000Z" }',
  "  },",
  '  "message": "登录成功"',
  "}",
];

const REGISTER_JSON = [
  "{",
  '  "success": true,',
  '  "data": {',
  '    "token": "<jwt>",',
  '    "user": { "id": "<uuid>", "username": "alice", "avatarUrl": null, "createdAt": "2026-07-29T02:00:00.000Z" }',
  "  },",
  '  "message": "注册成功"',
  "}",
];

const ITEMS_LIST_JSON = [
  "{",
  '  "success": true,',
  '  "data": {',
  '    "list": [{ "id": "<uuid>", "sellerId": "<uuid>", "title": "二手高等数学教材", "price": 25.5, "status": "on_sale", "sellerUsername": "alice", "categoryName": "教材" }],',
  '    "pagination": { "page": 1, "pageSize": 10, "total": 1, "totalPages": 1 }',
  "  }",
  "}",
];

const CREATE_ITEM_JSON = [
  "{",
  '  "success": true,',
  '  "data": { "id": "<uuid>", "sellerId": "<uuid>", "title": "二手高等数学教材", "price": 25.5, "status": "on_sale" },',
  '  "message": "创建成功"',
  "}",
];

const SELECT_BUYER_JSON = [
  "{",
  '  "success": true,',
  '  "data": {',
  '    "message": { "id": "<uuid>", "isSelected": true, "content": "还在吗？" },',
  '    "item": { "id": "<uuid>", "status": "reserved" }',
  "  },",
  '  "message": "已选为买家，商品状态更新为已预订"',
  "}",
];

const FAV_JSON = [
  "{",
  '  "success": true,',
  '  "data": [{ "id": "<uuid>", "title": "二手高等数学教材", "price": 25.5, "isFavorited": true }]',
  "}",
];

/* ---------- 封面 ---------- */
function coverSection() {
  const stripW = 360;
  const restW = PAGE_W - stripW;
  const metaW = [2200, restW - 2200 - 200];

  const banner = new Table({
    width: { size: restW - 200, type: WidthType.DXA },
    columnWidths: [restW - 200],
    rows: [
      new TableRow({
        height: { value: 900, rule: "atLeast" },
        children: [
          cell(
            restW - 200,
            [
              new Paragraph({
                spacing: { before: 200, after: 0, line: 276 },
                children: [run("CAMPUS SECONDHAND", { size: 16, color: MINT, bold: true })],
              }),
              new Paragraph({
                spacing: { before: 40, after: 80, line: 276 },
                children: [run("实施部  ·  详细设计", { size: 18, color: WHITE })],
              }),
            ],
            { fill: INK, borders: noBorders },
          ),
        ],
      }),
    ],
  });

  const meta = new Table({
    width: { size: metaW[0] + metaW[1], type: WidthType.DXA },
    columnWidths: metaW,
    rows: [
      ["部门", "实施部"],
      ["编写", "caiyonjie"],
      ["日期", "2026-08-14"],
      ["审核", "—"],
      ["批准", "—"],
    ].map(
      ([k, v], idx) =>
        new TableRow({
          children: [
            cell(
              metaW[0],
              [
                new Paragraph({
                  spacing: { line: 360, after: 0 },
                  children: [run(k, { size: 20, bold: true, color: WHITE })],
                }),
              ],
              { fill: INK },
            ),
            cell(
              metaW[1],
              [
                new Paragraph({
                  spacing: { line: 360, after: 0 },
                  children: [run(v, { size: 20, color: INK })],
                }),
              ],
              { fill: idx % 2 === 0 ? "F7F8F4" : WHITE },
            ),
          ],
        }),
    ),
  });

  const inner = [
    new Paragraph({ spacing: { before: 200, after: 200 }, children: [] }),
    banner,
    new Paragraph({ spacing: { before: 600, after: 80 }, children: [] }),
    new Paragraph({
      spacing: { after: 80, line: 276 },
      children: [run("DETAILED DESIGN SPECIFICATION", { size: 18, color: MINT, bold: true })],
    }),
    new Paragraph({
      spacing: { after: 80, line: 360 },
      children: [run("校园二手交易平台", { size: 56, bold: true, color: INK })],
    }),
    new Paragraph({
      spacing: { after: 400, line: 360 },
      children: [run("详细设计说明书", { size: 32, color: INK_SOFT })],
    }),
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: MINT } },
      spacing: { after: 280 },
      children: [],
    }),
    p("V1.0  初稿    接口字段以 docs/api-contract.md 为准", { size: 18, color: INK_SOFT, after: 280 }),
    meta,
  ];

  const layout = new Table({
    width: { size: PAGE_W, type: WidthType.DXA },
    columnWidths: [stripW, restW],
    rows: [
      new TableRow({
        children: [
          cell(stripW, [new Paragraph({ children: [] })], {
            fill: MINT,
            borders: noBorders,
            valign: VerticalAlign.TOP,
          }),
          cell(restW, inner, { borders: noBorders }),
        ],
      }),
    ],
  });

  return [layout];
}

/* ---------- 正文内容 ---------- */
function bodyChildren() {
  const out = [];

  out.push(frontTitle("版本记录"));
  out.push(
    makeTable(
      [1800, 1400, 3600, 2226],
      ["日期", "版本", "变更说明", "作者"],
      [["2026-08-14", "V1.0", "初稿", "caiyonjie"]],
      { size: 20 },
    ),
  );
  out.push(pageBreak());
  out.push(frontTitle("目录"));
  out.push(
    new TableOfContents("目录", {
      hyperlink: true,
      headingStyleRange: "1-3",
    }),
  );
  out.push(pageBreak());

  /* 1 */
  out.push(h1("1 引言"));
  out.push(h2("1.1 编写目的"));
  out.push(
    p("若本文与 docs/api-contract.md 在接口字段、路径或响应结构上存在差异，以 API 契约为准。"),
  );
  out.push(
    p("本文档用于详细说明校园二手交易平台的功能模块、业务逻辑、系统流程、数据库模型设计，指导开发人员进行系统搭建及编写代码。"),
  );
  out.push(p("预期读者：系统设计者、系统开发员。"));

  out.push(h2("1.2 背景"));
  out.push(
    p("校园场景下闲置物品流转需求明确，但缺少一套可快速部署的轻量交易平台。本系统面向在校用户，支持闲置发布、浏览检索、留言沟通、收藏与举报；卖家可在留言中选定买家并将商品标记为已预订。"),
  );
  out.push(
    p("设计目标是前后端一体部署于 Vercel、数据库使用 Neon Postgres，契约清晰（统一 JSON 响应，DB snake_case 与前端 camelCase 对照），鉴权统一为 JWT Bearer。"),
  );
  out.push(
    p("当前范围不包含在线支付、物流履约、实时 IM、管理后台与图片上传存储；商品图片仅支持外链 imageUrl。"),
  );

  out.push(h2("1.3 参考资料"));
  out.push(
    makeTable(
      [2800, 1400, 4826],
      ["文档名称", "版本号", "文件"],
      [
        ["README", "无独立版本号", "README.md"],
        ["系统设计文档", "2026-07-29 初版", "docs/design.md"],
        ["API 契约说明", "与仓库同步", "docs/api-contract.md"],
        ["测试说明", "与仓库同步", "TESTING.md"],
        ["数据库建表脚本", "与仓库同步", "db/schema.sql"],
      ],
    ),
  );

  out.push(h2("1.4 专业术语、定义和缩略语"));
  out.push(
    makeTable(
      [800, 2200, 6026],
      ["序号", "专业术语", "描述"],
      [
        ["1", "校园集市", "前端品牌名，侧栏展示为「校园集市 / Campus Board」，系统正式名称为校园二手交易平台。"],
        ["2", "JWT", "JSON Web Token。登录/注册成功后签发，有效期 7 天，payload 含 userId；请求头 Authorization: Bearer <token>。"],
        ["3", "item_status", "商品状态枚举：on_sale（在售中）、reserved（已预订）、sold（已售出）、removed（已下架）。"],
        ["4", "snake_case / camelCase", "数据库列使用 snake_case；API 经 mapItem / mapMessage / mapUser 转为 camelCase 返回前端。"],
        ["5", "选买家", "卖家对某条留言执行 PATCH /api/messages/:id，该留言 isSelected=true，商品 status 改为 reserved。"],
        ["6", "guestOnly / requiresAuth", "前端路由元信息。guestOnly：已登录访问登录/注册页回首页；requiresAuth：未登录跳转登录并带 redirect。"],
        ["7", "cs_token / cs_user", "前端 localStorage 持久化键，分别保存 JWT 与用户信息。"],
      ],
    ),
  );

  /* 2 */
  out.push(h1("2 方案架构设计"));
  out.push(h2("2.1 应用架构设计"));
  out.push(
    p("系统为前后端一体的 Web 应用：浏览器加载 Vue 3 SPA；业务请求走 /api/*，由 Vercel Serverless Functions 处理；数据持久化在 Neon Postgres。本地开发时 Vite 将 /api 代理到 api/dev-server.js（端口 3000）。无独立管理端、无第三方业务系统对接。"),
  );
  out.push(h3("2.1.1 应用集成"));
  out.push(
    makeTable(
      [1000, 1100, 1100, 800, 1200, 1600, 1000, 1226],
      ["模块", "功能点", "交互方式", "方向", "外部应用", "外部功能名称/描述", "备注", "接口地址"],
      [["无", "无", "无", "无", "无", "无", "无", "无"]],
      { size: 16 },
    ),
  );

  out.push(h2("2.2 数据架构设计"));
  out.push(h3("2.2.1 数据结构设计"));
  out.push(p("字段名同时给出库列（snake_case）与 API（camelCase）。password_hash 不回传前端。"));

  out.push(labelP("users"));
  out.push(
    makeTable(
      [2800, 1800, 1800, 2626],
      ["字段名", "类型", "约束", "说明"],
      [
        ["id / id", "UUID", "PK，DEFAULT gen_random_uuid()", "用户主键"],
        ["username / username", "VARCHAR(64)", "NOT NULL，UNIQUE", "登录名，2–64 字符"],
        ["password_hash / （不回传）", "VARCHAR(255)", "NOT NULL", "bcrypt 哈希，salt rounds=10"],
        ["avatar_url / avatarUrl", "TEXT", "可空", "头像 URL，当前注册流程不写入"],
        ["created_at / createdAt", "TIMESTAMPTZ", "NOT NULL，DEFAULT now()", "创建时间"],
      ],
      { size: 16 },
    ),
  );

  out.push(labelP("categories"));
  out.push(
    makeTable(
      [2800, 1800, 1800, 2626],
      ["字段名", "类型", "约束", "说明"],
      [
        ["id / id", "UUID", "PK", "分类主键"],
        ["name / name", "VARCHAR(64)", "NOT NULL", "分类名。种子：教材、数码、生活用品、服饰、其他"],
      ],
      { size: 16 },
    ),
  );

  out.push(labelP("items"));
  out.push(
    makeTable(
      [2800, 1800, 1800, 2626],
      ["字段名", "类型", "约束", "说明"],
      [
        ["id / id", "UUID", "PK", "商品主键"],
        ["seller_id / sellerId", "UUID", "NOT NULL，FK users ON DELETE CASCADE", "卖家"],
        ["title / title", "VARCHAR(200)", "NOT NULL", "标题；前端输入 maxlength=80"],
        ["description / description", "TEXT", "可空", "描述"],
        ["price / price", "NUMERIC(12,2)", "NOT NULL", "价格，必须 > 0；响应中转为 number"],
        ["category_id / categoryId", "UUID", "FK categories ON DELETE SET NULL", "分类，可空"],
        ["status / status", "item_status", "NOT NULL，DEFAULT on_sale", "on_sale / reserved / sold / removed"],
        ["image_url / imageUrl", "TEXT", "可空", "图片外链，不做严格 URL 校验"],
        ["created_at / createdAt", "TIMESTAMPTZ", "NOT NULL，DEFAULT now()", "创建时间"],
        ["updated_at / updatedAt", "TIMESTAMPTZ", "NOT NULL，DEFAULT now()", "更新时间"],
        ["（联表）seller_username / sellerUsername", "VARCHAR", "查询联表", "卖家用户名"],
        ["（联表）category_name / categoryName", "VARCHAR", "查询联表", "分类名称"],
      ],
      { size: 16 },
    ),
  );

  out.push(labelP("messages"));
  out.push(
    makeTable(
      [2800, 1800, 1800, 2626],
      ["字段名", "类型", "约束", "说明"],
      [
        ["id / id", "UUID", "PK", "留言主键"],
        ["item_id / itemId", "UUID", "NOT NULL，FK items ON DELETE CASCADE", "所属商品"],
        ["sender_id / senderId", "UUID", "NOT NULL，FK users ON DELETE CASCADE", "发送者"],
        ["content / content", "TEXT", "NOT NULL", "留言内容，trim 后非空"],
        ["is_selected / isSelected", "BOOLEAN", "NOT NULL，DEFAULT false", "是否被选为买家"],
        ["created_at / createdAt", "TIMESTAMPTZ", "NOT NULL，DEFAULT now()", "创建时间"],
        ["（联表）sender_username / senderUsername", "VARCHAR", "查询联表", "发送者用户名"],
      ],
      { size: 16 },
    ),
  );

  out.push(labelP("favorites"));
  out.push(
    makeTable(
      [2800, 1800, 1800, 2626],
      ["字段名", "类型", "约束", "说明"],
      [
        ["id / id", "UUID", "PK", "收藏记录主键"],
        ["user_id / userId", "UUID", "NOT NULL，FK users ON DELETE CASCADE", "收藏用户"],
        ["item_id / itemId", "UUID", "NOT NULL，FK items ON DELETE CASCADE", "商品"],
        ["created_at / createdAt", "TIMESTAMPTZ", "NOT NULL，DEFAULT now()", "收藏时间"],
        ["UNIQUE(user_id, item_id)", "—", "唯一约束", "同一用户对同一商品仅一条收藏"],
      ],
      { size: 16 },
    ),
  );

  out.push(labelP("reports"));
  out.push(
    makeTable(
      [2800, 1800, 1800, 2626],
      ["字段名", "类型", "约束", "说明"],
      [
        ["id / id", "UUID", "PK", "举报主键"],
        ["item_id / itemId", "UUID", "NOT NULL，FK items ON DELETE CASCADE", "被举报商品"],
        ["reporter_id / reporterId", "UUID", "NOT NULL，FK users ON DELETE CASCADE", "举报人"],
        ["reason / reason", "TEXT", "NOT NULL", "理由，trim 后非空"],
        ["created_at / createdAt", "TIMESTAMPTZ", "NOT NULL，DEFAULT now()", "提交时间"],
      ],
      { size: 16 },
    ),
  );

  out.push(h3("2.2.2 数据关系图"));
  out.push(
    makeTable(
      [1800, 2200, 2200, 2826],
      ["父实体", "关系", "子实体", "约束"],
      [
        ["users", "1:N", "items", "items.seller_id → users.id ON DELETE CASCADE"],
        ["users", "1:N", "messages", "messages.sender_id → users.id ON DELETE CASCADE"],
        ["users", "1:N", "favorites", "favorites.user_id → users.id ON DELETE CASCADE"],
        ["users", "1:N", "reports", "reports.reporter_id → users.id ON DELETE CASCADE"],
        ["categories", "1:N", "items", "items.category_id → categories.id ON DELETE SET NULL"],
        ["items", "1:N", "messages", "messages.item_id → items.id ON DELETE CASCADE"],
        ["items", "1:N", "favorites", "favorites.item_id → items.id ON DELETE CASCADE"],
        ["items", "1:N", "reports", "reports.item_id → items.id ON DELETE CASCADE"],
      ],
      { size: 16 },
    ),
  );
  out.push(
    p("基数说明：一名用户可发布多件商品、发送多条留言、收藏多件商品、提交多条举报；一个分类下可有多件商品；一件商品可有多条留言、多次收藏与多条举报。收藏在 (user_id, item_id) 上唯一。"),
  );

  out.push(h3("2.2.3 数据分布"));
  out.push(
    p("全部业务数据存放于 Neon Postgres 单库（Neon 控制台项目名应为 campus-secondhand）。无独立缓存、无多库分片、无本地文件库。图片不入库二进制，仅存外链 URL。JWT 密钥与连接串通过环境变量 DATABASE_URL、JWT_SECRET 注入（本地根目录 .env，线上 Vercel Environment Variables）。前端会话仅存浏览器 localStorage。"),
  );

  out.push(h3("2.2.4 系统业务描述"));
  out.push(p("1. 访客注册或登录，服务端校验后签发 JWT，前端写入 Pinia 与 localStorage。"));
  out.push(p("2. 访客在首页按关键词、分类浏览公开列表（默认 on_sale 与 reserved），点击卡片进入详情。"));
  out.push(p("3. 登录用户发布闲置（标题、价格必填；可选描述、分类、图片 URL）；5 分钟内同卖家同标题拒绝。"));
  out.push(p("4. 买家在详情页留言；留言列表仅卖家或曾留言者可见。"));
  out.push(p("5. 卖家在在售商品的留言上「选为买家」，该留言 isSelected=true，商品进入 reserved。"));
  out.push(p("6. 登录用户可收藏/取消收藏（幂等），可提交举报（仅落库，无审核后台）。"));
  out.push(p("7. 卖家在「我的发布」中查看全部状态商品，并可改状态或进入编辑页。"));
  out.push(p("不做：在线支付、物流履约、实时 IM / WebSocket、管理后台与举报审核工作流、图片上传存储。"));

  out.push(h2("2.3 技术架构设计"));
  out.push(h3("2.3.1 技术选型总览"));
  out.push(
    makeTable(
      [2200, 6826],
      ["分类", "技术组件"],
      [
        ["服务框架", "Node.js 18+；Vercel Serverless Functions（api/ 目录文件映射为 /api/*）"],
        ["运行支撑", "本地 api/dev-server.js（默认 :3000）；生产由 Vercel 托管；Vite 开发代理 /api → localhost:3000"],
        ["前端", "Vue 3、Vite、TypeScript、Vue Router、Pinia、Axios、Element Plus"],
        ["数据存储", "Neon Postgres；@neondatabase/serverless；扩展 pgcrypto"],
        ["鉴权", "bcryptjs（密码，salt rounds=10）；jsonwebtoken（JWT，有效期 7d）"],
        ["外部 AI", "无"],
        ["测试", "Vitest；API 直调 handler 连真实库；前端 @vue/test-utils + happy-dom"],
        ["字体 CDN", "Google Fonts：Space Grotesk / Inter / JetBrains Mono（仅前端展示，非业务集成）"],
      ],
    ),
  );

  out.push(h3("2.3.2 技术架构设计"));
  out.push(p("分层：浏览器 → Vue 3 SPA（web/dist 静态托管）→ 开发期 Vite 代理（:5173 → :3000）或生产期 Vercel 路由 → api/* Serverless（_lib/auth、_lib/db、_lib/response）→ Neon Postgres。"));
  out.push(p("鉴权存在：需鉴权接口统一调用 verifyToken，从 Authorization Bearer 解析 JWT；JWT_SECRET 未配置时签发失败、校验返回 500。前端 request.ts 自动带 Token；401 由拦截器提示并跳转登录。"));
  out.push(p("流量分流：/api/* 进入 Functions；其余 rewrite 到 index.html，以支持 Vue Router history。"));
  out.push(p("全局失败体约定（全文仅此出现一次，后续功能点写「失败体见全局约定」）："));
  out.push(...codeBlock(FAIL_JSON));
  out.push(p("HTTP 状态码表达语义（如 401 / 403 / 404 / 409）；success 为 false，data 多为 null，message 为错误说明。"));

  out.push(h3("2.3.3 技术组件清单"));
  out.push(
    makeTable(
      [2400, 3600, 3026],
      ["组件名称", "描述", "使用备注"],
      [
        ["Vue 3 + Vite", "前端 SPA 与构建", "产物输出 web/dist"],
        ["Vue Router / Pinia", "路由守卫与登录态", "requiresAuth / guestOnly；useUserStore"],
        ["Axios + request.ts", "统一请求封装", "禁止业务另起 Axios 实例"],
        ["Element Plus", "表单、分页、空态、对话框", "错误提示统一 ElMessage"],
        ["Vercel Serverless Functions", "后端接口", "api/ 文件路径映射 URL"],
        ["api/_lib/auth.js", "密码哈希与 JWT", "禁止各接口自写校验"],
        ["api/_lib/db.js", "共享 neon() 客户端", "禁止各接口各自 new 连接"],
        ["api/_lib/response.js", "ok / fail / mapItem 等", "snake_case → camelCase"],
        ["Neon Postgres", "业务库", "须执行 db/schema.sql"],
        ["Vitest", "API 与前端单测", "见 TESTING.md"],
        ["Google Fonts", "展示字体", "非业务数据通道"],
      ],
      { size: 16 },
    ),
  );

  out.push(h2("2.4 部署架构设计"));
  out.push(h3("2.4.1 服务划分"));
  out.push(
    makeTable(
      [2400, 6626],
      ["服务名", "服务描述"],
      [
        ["web（Vite / 静态 SPA）", "Vue 3 前端。开发 npm run dev 监听 :5173；生产构建为 web/dist，由 Vercel 静态托管。"],
        ["api（Serverless Functions）", "Node.js 接口。开发 npm run dev 启动 dev-server.js（:3000）；生产由 Vercel 识别 api/ 目录。"],
      ],
    ),
  );

  out.push(h3("2.4.2 部署要求"));
  out.push(
    makeTable(
      [1800, 1000, 1600, 1200, 1600, 1826],
      ["运行服务", "节点数", "内存", "CPU", "网络", "部署环境"],
      [
        ["web 开发（Vite）", "1", "本机开发，无强制配额", "本机开发，无强制配额", "本机 localhost:5173，代理 /api", "本机开发"],
        ["api 开发（dev-server）", "1", "本机开发，无强制配额", "本机开发，无强制配额", "本机 localhost:3000", "本机开发"],
        ["Vercel 生产（SPA + Functions）", "1（平台弹性）", "按 Vercel 套餐", "按 Vercel 套餐", "HTTPS；/api/* 与 SPA rewrite", "Vercel；环境变量 DATABASE_URL、JWT_SECRET"],
        ["Neon Postgres", "1", "按 Neon 套餐", "按 Neon 套餐", "应用经 DATABASE_URL 出站访问", "Neon 项目 campus-secondhand"],
      ],
      { size: 16 },
    ),
  );
  out.push(p("Vercel 项目根必须为仓库根（不要设为 web/）。vercel.json：installCommand 分别安装 api/ 与 web/；buildCommand 构建前端；outputDirectory 为 web/dist。"));

  /* 3 */
  out.push(h1("3 功能模块详细设计"));
  out.push(
    p("模块按真实前端页面划分。布局壳 AppLayout 提供侧栏：首页、发布、我的发布、我的收藏；未登录显示「登录」，已登录显示用户名与「退出」。登录/注册页隐藏侧栏。无管理端角色。"),
  );

  out.push(h2("3.1 功能：账号与鉴权"));
  out.push(
    ...featureBlock(
      "3.1.1 登录",
      [
        "页面路由 /login（name=login，meta.guestOnly）。无产品截图，以下为布局说明。",
        "居中卡片（约 420px）：眉题 Account / Sign in，标题「登录校园集市」，说明文案，表单区，底部「还没有账号？去注册」。本页隐藏 AppLayout 侧栏。",
        "表单字段：用户名（输入框）、密码（密码框，可显示密码，回车提交）。",
        "空态：无列表。校验失败提示「请输入用户名和密码」。已登录访问本页由守卫重定向首页。",
      ],
      [
        { item: "角色", lines: ["访客（未登录）。已登录用户访问本页会被路由守卫重定向至首页。无管理端角色。"] },
        { item: "功能简介", lines: ["使用用户名与密码登录，签发 JWT 并写入本地会话。"] },
        {
          item: "前端页面及交互说明",
          lines: [
            "筛选项：无。",
            "展示字段：用户名、密码（只写）。",
            "布局与交互：居中认证卡片；隐藏侧栏。提交前校验用户名 trim 与密码非空。成功后 applyAuthResult 写入 Pinia 与 localStorage（cs_token、cs_user），跳转 query.redirect 或首页。接口错误由 request 拦截器 ElMessage 提示。",
          ],
        },
        {
          item: "按钮",
          lines: [
            "【登录】：校验通过后调用登录接口；loading 时文案「登录中…」且禁用。无二次确认。",
          ],
        },
        {
          item: "接口设计",
          lines: [
            "【新增接口】：无。",
            "【调用旧接口】：POST /api/auth/login。",
            "【修改旧接口】：无。",
            "【调用第三方接口】：无。",
          ],
        },
        {
          item: "后端逻辑",
          lines: [
            "仅允许 POST，其它方法 405。",
            "username trim、password 非空，否则 400。",
            "按 username 查 users；不存在或 bcrypt 不匹配均 401「用户名或密码错误」。",
            "mapUser 去掉 password_hash；generateToken(userId)，有效期 7d。",
            "失败体见全局约定。",
          ],
        },
        { item: "关联表", lines: ["users"] },
      ],
      [
        p("登录请求字段："),
        fieldTable([
          ["username", "string", "是", "用户名"],
          ["password", "string", "是", "密码"],
        ]),
        spacer(),
        p("成功响应示例："),
        ...codeBlock(LOGIN_JSON),
      ],
    ),
  );

  out.push(
    ...featureBlock(
      "3.1.2 注册",
      [
        "页面路由 /register（name=register，meta.guestOnly）。无产品截图。",
        "居中卡片：眉题 Account / Sign up，标题「注册新账号」，表单区，底部「已有账号？去登录」。隐藏侧栏。",
        "表单字段：用户名、密码（至少 6 位）、确认密码。",
        "前端校验：用户名为空提示「请输入用户名」；密码短于 6 位提示「密码至少 6 位」；两次密码不一致提示「两次输入的密码不一致」。",
      ],
      [
        { item: "角色", lines: ["访客（未登录）。已登录访问本页回首页。无管理端角色。"] },
        { item: "功能简介", lines: ["创建账号并自动登录，返回 token 与 user。"] },
        {
          item: "前端页面及交互说明",
          lines: [
            "筛选项：无。",
            "展示字段：用户名、密码、确认密码（确认密码仅前端使用，不传后端）。",
            "布局与交互：居中卡片。成功后 applyAuthResult 并跳转首页。用户名冲突等错误由拦截器提示。",
          ],
        },
        {
          item: "按钮",
          lines: ["【注册】：前端校验通过后调用注册接口；loading 时「提交中…」且禁用。无二次确认。"],
        },
        {
          item: "接口设计",
          lines: [
            "【新增接口】：无。",
            "【调用旧接口】：POST /api/auth/register。",
            "【修改旧接口】：无。",
            "【调用第三方接口】：无。",
          ],
        },
        {
          item: "后端逻辑",
          lines: [
            "username 非空且长度 2–64，否则 400。",
            "password 至少 6 位，否则 400。",
            "用户名已存在 409「用户名已存在」。",
            "bcrypt 哈希入库，签发 JWT，HTTP 201。",
            "失败体见全局约定。",
          ],
        },
        { item: "关联表", lines: ["users"] },
      ],
      [
        p("注册请求字段："),
        fieldTable([
          ["username", "string", "是", "2–64 字符，唯一"],
          ["password", "string", "是", "至少 6 位"],
        ]),
        spacer(),
        p("成功响应示例（201）："),
        ...codeBlock(REGISTER_JSON),
      ],
    ),
  );

  out.push(h2("3.2 功能：商品浏览"));
  out.push(
    ...featureBlock(
      "3.2.1 首页商品列表",
      [
        "页面路由 /（name=home），公开。无产品截图。",
        "顶部英雄区：眉题 Home / 商品列表，标题「校园布告栏」，导语。其下工具条：关键词输入、分类下拉、搜索按钮。",
        "主体为商品卡片网格（ItemCard：图片或「暂无图片」、状态标签、标题、价格），点击进入详情。",
        "空态：ElEmpty「暂无商品」。总数大于 pageSize（10）时显示分页 prev / pager / next。",
      ],
      [
        { item: "角色", lines: ["访客与注册用户均可访问。列表不要求登录。"] },
        { item: "功能简介", lines: ["按关键词与分类分页浏览公开在售、已预订商品。"] },
        {
          item: "前端页面及交互说明",
          lines: [
            "筛选项：关键词输入（非必填，标题模糊，回车或清空即搜索）；分类下拉（非必填，精确匹配 categoryId，变更即重置到第 1 页并查询）。",
            "展示字段：状态、标题、价格、封面图（卡片不展示卖家与描述）。",
            "布局与交互：工具条 + 网格 + 底部分页。pageSize 固定 10。加载中 v-loading。侧栏可进发布/我的发布/收藏（需登录则先跳登录）。",
          ],
        },
        {
          item: "按钮",
          lines: ["【搜索】：page 置 1 后重新拉取列表。无二次确认。"],
        },
        {
          item: "接口设计",
          lines: [
            "【新增接口】：无。",
            "【调用旧接口】：GET /api/categories；GET /api/items（keyword、categoryId、page、pageSize）。",
            "【修改旧接口】：无。",
            "【调用第三方接口】：无。",
          ],
        },
        {
          item: "后端逻辑",
          lines: [
            "分类：按 name 升序返回 id、name。",
            "公开列表默认 status 为 on_sale 与 reserved；keyword 对 title ILIKE；按 created_at DESC。",
            "page 默认 1，pageSize 默认 10、最大 50。",
            "COUNT(*) OVER() 计算 total。失败体见全局约定。",
          ],
        },
        { item: "关联表", lines: ["items, categories, users"] },
      ],
      [
        p("GET /api/items 查询参数："),
        fieldTable([
          ["keyword", "string", "否", "标题模糊搜索"],
          ["categoryId", "uuid", "否", "分类筛选"],
          ["status", "string", "否", "本页不传；公开默认 on_sale+reserved"],
          ["mine", "boolean", "否", "本页不传"],
          ["page", "number", "否", "默认 1"],
          ["pageSize", "number", "否", "本页传 10"],
        ]),
        spacer(),
        p("成功响应示例："),
        ...codeBlock(ITEMS_LIST_JSON),
      ],
    ),
  );

  out.push(h2("3.3 功能：商品发布与管理"));
  out.push(
    ...featureBlock(
      "3.3.1 发布与编辑商品",
      [
        "同一页面 ItemFormView。发布路由 /items/new（requiresAuth）；编辑路由 /items/:id/edit（requiresAuth）。无产品截图。",
        "标题随模式切换：「发布闲置」或「编辑商品」。表单最大宽度约 720px。",
        "字段：标题（必填，最多 80 字计字）、描述（选填，最多 1000 字）、价格（必填，数字，最小 0.01）、分类（选填下拉）、图片 URL（选填）。填写 URL 后显示预览；加载失败显示「无法加载该图片…」。",
        "提示：搜索引擎结果链常带防盗链，建议图床直链。编辑加载失败时退回 /my/items。",
      ],
      [
        { item: "角色", lines: ["注册用户（JWT）。编辑仅商品所属卖家在后端校验；非卖家 PATCH 返回 403。"] },
        { item: "功能简介", lines: ["发布新闲置或编辑已有商品的标题、描述、价格、分类与图片外链。"] },
        {
          item: "前端页面及交互说明",
          lines: [
            "筛选项：无。",
            "展示字段：标题、描述、价格、分类、图片 URL；编辑模式进入时用详情回填。",
            "布局与交互：未登录由守卫跳转 /login?redirect=当前路径。标题空提示「请填写标题」；价格未填或 ≤0 提示「价格须大于 0」。成功跳转商品详情。",
          ],
        },
        {
          item: "按钮",
          lines: [
            "【取消】：router.back()，无确认框。",
            "【立即发布】：创建模式提交；saving 时「保存中…」禁用。",
            "【保存修改】：编辑模式提交，行为同上。",
          ],
        },
        {
          item: "接口设计",
          lines: [
            "【新增接口】：无。",
            "【调用旧接口】：GET /api/categories；GET /api/items/:id（仅编辑）；POST /api/items（发布）；PATCH /api/items/:id（编辑）。",
            "【修改旧接口】：无。",
            "【调用第三方接口】：无。",
          ],
        },
        {
          item: "后端逻辑",
          lines: [
            "创建：verifyToken；标题非空；价格 >0；分类存在性校验；5 分钟内同卖家同标题 409；默认 status=on_sale；201。",
            "更新：仅卖家；字段均为可选；标题非空、价格 >0、status 须为合法枚举；updated_at=now()。",
            "imageUrl 无协议/格式强校验。失败体见全局约定。",
          ],
        },
        { item: "关联表", lines: ["items, categories, users"] },
      ],
      [
        p("创建商品请求字段："),
        fieldTable([
          ["title", "string", "是", "标题"],
          ["price", "number", "是", "必须 > 0"],
          ["description", "string", "否", "描述"],
          ["categoryId", "uuid", "否", "分类 ID"],
          ["imageUrl", "string", "否", "图片外链"],
        ]),
        spacer(),
        p("成功响应示例（201）："),
        ...codeBlock(CREATE_ITEM_JSON),
      ],
    ),
  );

  out.push(
    ...featureBlock(
      "3.3.2 我的发布",
      [
        "页面路由 /my/items（requiresAuth）。无产品截图。",
        "页头标题「我发布的闲置」，右侧「发布新商品」。",
        "列表每行：缩略图（无图用 placehold.co 占位）、标题、StatusTag、价格、分类与更新时间、状态下拉、查看、编辑。",
        "空态：「还没有发布过商品」。状态下拉选项：在售中 / 已预订 / 已售出 / 已下架。",
      ],
      [
        { item: "角色", lines: ["注册用户（JWT）。仅返回当前用户作为卖家的商品。"] },
        { item: "功能简介", lines: ["查看自己发布的全部状态商品，并快捷改状态或进入编辑/详情。"] },
        {
          item: "前端页面及交互说明",
          lines: [
            "筛选项：无独立查询区；请求 mine=true、page=1、pageSize=50。",
            "展示字段：封面、标题、状态、价格、分类名、更新时间。",
            "布局与交互：行列表。改状态失败会重新 load。未登录跳转登录。",
          ],
        },
        {
          item: "按钮",
          lines: [
            "【发布新商品】：跳转 /items/new。",
            "【查看】：跳转 /items/:id。",
            "【编辑】：跳转 /items/:id/edit。",
            "【状态下拉】：变更即 PATCH status，成功提示「状态已更新」。无二次确认。",
          ],
        },
        {
          item: "接口设计",
          lines: [
            "【新增接口】：无。",
            "【调用旧接口】：GET /api/items?mine=true（需鉴权）；PATCH /api/items/:id（改 status）。",
            "【修改旧接口】：无。",
            "【调用第三方接口】：无。",
          ],
        },
        {
          item: "后端逻辑",
          lines: [
            "mine=true 时 verifyToken，默认返回全部 item_status。",
            "PATCH 仅卖家；status 须属于 on_sale / reserved / sold / removed。",
            "失败体见全局约定。",
          ],
        },
        { item: "关联表", lines: ["items, categories, users"] },
      ],
    ),
  );

  out.push(h2("3.4 功能：商品详情与沟通"));
  out.push(
    ...featureBlock(
      "3.4.1 商品详情",
      [
        "页面路由 /items/:id（公开）。留言、选买家、收藏、举报均在本页，无独立路由。无产品截图。",
        "左图右文：有图则展示（referrerpolicy=no-referrer），否则「暂无图片」。信息区：状态标签、卖家用户名、标题、价格、描述（无则「暂无描述」）。",
        "操作：收藏/已收藏、举报；卖家另见「编辑」。",
        "留言区：列表显示发送者、时间、内容、「已选买家」标记；卖家在商品 on_sale 且该条未选中时显示「选为买家」。未登录提示「登录后可查看与发表留言」；403 提示「发表留言后即可查看全部留言」。空列表「还没有留言，来打个招呼吧」。底部留言输入最多 300 字。",
        "商品不存在：ElEmpty「商品不存在或已删除」。举报弹窗标题「举报商品」，理由最多 200 字，页脚取消/提交。",
      ],
      [
        { item: "角色", lines: ["访客可看详情。留言/收藏/举报需注册用户。选买家、编辑入口仅卖家。无管理端。"] },
        { item: "功能简介", lines: ["查看商品详情，并完成留言、选买家、收藏与举报。"] },
        {
          item: "前端页面及交互说明",
          lines: [
            "筛选项：无。",
            "展示字段：图片、状态、卖家、标题、价格、描述、留言列表（发送者、时间、内容、是否选中）。",
            "布局与交互：未登录点收藏/留言/举报会跳转登录并带 redirect。收藏态通过拉取收藏列表判断。举报弹窗打开时清空理由。",
          ],
        },
        {
          item: "按钮",
          lines: [
            "【收藏】/【已收藏】：未登录跳登录；否则 POST 或 DELETE /api/favorites/:itemId，幂等。",
            "【举报】：打开举报对话框。",
            "【取消】（对话框）：关闭。",
            "【提交】（对话框）：理由为空提示「请填写举报理由」；否则 POST /api/reports。",
            "【编辑】：仅卖家，跳转编辑页。",
            "【发表留言】：内容 trim 为空提示「请输入留言内容」。",
            "【选为买家】：仅卖家且商品在售；调用 PATCH /api/messages/:id。无二次确认。",
          ],
        },
        {
          item: "接口设计",
          lines: [
            "【新增接口】：无。",
            "【调用旧接口】：GET /api/items/:id；GET /api/items/:id/messages；POST /api/items/:id/messages；PATCH /api/messages/:id；GET /api/favorites；POST /api/favorites/:itemId；DELETE /api/favorites/:itemId；POST /api/reports。",
            "【修改旧接口】：无。",
            "【调用第三方接口】：无。",
          ],
        },
        {
          item: "后端逻辑",
          lines: [
            "详情不存在 404「商品不存在」。",
            "留言列表：需鉴权；仅卖家或曾留言者，否则 403。按 created_at 升序。",
            "发表留言：content trim 非空；201。",
            "选买家：仅卖家；商品须 on_sale 否则 400；目标留言 is_selected=true，同商品其它选中取消；商品改为 reserved。无并发锁。",
            "收藏：商品不存在 404；重复收藏 ON CONFLICT DO NOTHING。取消不存在记录仍 200。",
            "举报：itemId、reason 必填；仅落库，无审核流。失败体见全局约定。",
          ],
        },
        { item: "关联表", lines: ["items, users, categories, messages, favorites, reports"] },
      ],
      [
        p("发表留言请求字段："),
        fieldTable([["content", "string", "是", "trim 后非空；前端最多 300 字"]]),
        spacer(),
        p("选为买家成功响应示例："),
        ...codeBlock(SELECT_BUYER_JSON),
        spacer(),
        p("举报请求字段："),
        fieldTable([
          ["itemId", "uuid", "是", "被举报商品 ID"],
          ["reason", "string", "是", "trim 后非空；前端最多 200 字"],
        ]),
      ],
    ),
  );

  out.push(h2("3.5 功能：收藏"));
  out.push(
    ...featureBlock(
      "3.5.1 我的收藏",
      [
        "页面路由 /my/favorites（requiresAuth）。无产品截图。",
        "标题「收藏夹」，导语「想要的闲置先钉在这里，别让它溜走。」",
        "网格：ItemCard + 卡片下方「取消收藏」。空态：「收藏夹还是空的」。",
      ],
      [
        { item: "角色", lines: ["注册用户（JWT）。"] },
        { item: "功能简介", lines: ["查看当前用户收藏的商品并取消收藏。"] },
        {
          item: "前端页面及交互说明",
          lines: [
            "筛选项：无。",
            "展示字段：与首页卡片相同（图、状态、标题、价格），另带取消按钮。",
            "布局与交互：卡片点击进详情。取消成功后从列表移除。未登录跳转登录。",
          ],
        },
        {
          item: "按钮",
          lines: ["【取消收藏】：DELETE /api/favorites/:itemId，成功提示「已取消收藏」。无二次确认。"],
        },
        {
          item: "接口设计",
          lines: [
            "【新增接口】：无。",
            "【调用旧接口】：GET /api/favorites；DELETE /api/favorites/:itemId。",
            "【修改旧接口】：无。",
            "【调用第三方接口】：无。",
          ],
        },
        {
          item: "后端逻辑",
          lines: [
            "列表按收藏 created_at 倒序，联表商品并标记 isFavorited=true。",
            "删除不存在记录仍返回成功。失败体见全局约定。",
          ],
        },
        { item: "关联表", lines: ["favorites, items, users, categories"] },
      ],
      [p("成功响应示例："), ...codeBlock(FAV_JSON)],
    ),
  );

  /* 4 */
  out.push(h1("4 设计与实现上的难点"));
  out.push(
    makeTable(
      [2200, 2800, 4026],
      ["难点", "影响", "处理方式"],
      [
        ["并发选买家", "多请求同时 PATCH /api/messages/:id 时，可能出现多条 is_selected 或状态不一致。当前测试未覆盖。", "现实现为顺序 UPDATE，无行锁/事务包裹。文档记录风险；后续可加事务或条件更新。"],
        ["imageUrl 未校验", "恶意或无效链接仍可入库；防盗链导致列表/详情裂图。", "前端 referrerpolicy=no-referrer、预览失败提示与占位图；后端不拒绝。TESTING.md 列为缺口。"],
        ["5 分钟同标题 409", "防抖重复发布；边界用例未纳入自动化测试。", "创建时查同卖家同标题且 created_at 在 5 分钟内则 409。"],
        ["Token 过期/篡改边界", "过期 JWT、伪造签名等鉴权边界测试未覆盖。", "verifyToken 校验签名与 userId；失败 401。JWT_SECRET 缺失返回 500。"],
        ["权限 403 边界", "非卖家选买家、非留言者看留言列表等场景测试不足。", "代码已返回 403；前端留言区对 403 展示「发表留言后即可查看全部留言」。"],
        ["无 E2E", "代理、路由守卫、真组件行为未端到端验证。", "当前仅 API handler 集成测与少量组件单测。"],
        ["集成测试脏数据", "用例写入真实 Neon 且无 teardown，长期跑测产生垃圾数据。", "用户名使用时间戳+随机后缀降低冲突；需定期手工清理。"],
        ["本地双进程联调", "只启前端会出现 ECONNREFUSED / http proxy error。", "README 明确需同时启动 api:3000 与 web:5173。"],
        ["举报无审核", "reports 仅落库，无法运营处理。", "明确为非目标，不发明后台。"],
      ],
      { size: 16 },
    ),
  );

  /* 5 */
  out.push(h1("5 开发时间表"));
  out.push(p("仓库 git 提交均集中在 2026-07-29，无独立排期文档。下表按提交主题拆分阶段，人天为同日工作量拆分，合计 1 人天。"));
  out.push(
    makeTable(
      [2800, 1600, 1600, 1000, 2026],
      ["工作计划内容", "计划开始时间", "计划完成时间", "人天", "备注"],
      [
        ["项目初始化、视觉设计系统与项目约定", "2026-07-29", "2026-07-29", "0.20", "按仓库记录整理"],
        ["API 与数据层（鉴权、商品、留言、收藏、举报）及 schema", "2026-07-29", "2026-07-29", "0.30", "按仓库记录整理"],
        ["前端登录注册、分类与商品列表对接真实接口", "2026-07-29", "2026-07-29", "0.20", "按仓库记录整理"],
        ["核心链路测试、README 部署说明与 Vercel 配置", "2026-07-29", "2026-07-29", "0.15", "按仓库记录整理"],
        ["本地 API dev-server、图片容错与系统设计文档", "2026-07-29", "2026-07-29", "0.15", "按仓库记录整理"],
      ],
      { size: 16 },
    ),
  );

  return out;
}

async function main() {
  const header = new Header({
    children: [
      new Paragraph({
        spacing: { after: 80 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 12, color: MINT },
        },
        children: [
          run("校园二手交易平台", { size: 18, bold: true, color: INK }),
          run("    详细设计说明书", { size: 18, color: INK_SOFT }),
        ],
      }),
    ],
  });

  const footer = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: {
          top: { style: BorderStyle.SINGLE, size: 6, color: LINE },
        },
        spacing: { before: 80 },
        children: [
          new TextRun({
            children: [PageNumber.CURRENT],
            font: FONT,
            size: 18,
            color: INK_SOFT,
          }),
        ],
      }),
    ],
  });

  const emptyHeader = new Header({ children: [new Paragraph({ children: [] })] });
  const emptyFooter = new Footer({ children: [new Paragraph({ children: [] })] });

  const doc = new Document({
    features: { updateFields: true },
    styles: {
      default: {
        document: {
          run: { font: FONT, size: 20, color: INK },
          paragraph: { spacing: { line: 360, lineRule: "auto" } },
        },
      },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickStyle: true,
          run: { font: FONT, size: 20, bold: true, color: INK },
          paragraph: {
            spacing: { before: 360, after: 160, line: 360 },
            outlineLevel: 0,
          },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickStyle: true,
          run: { font: FONT, size: 20, bold: true, color: INK },
          paragraph: {
            spacing: { before: 280, after: 120, line: 360 },
            outlineLevel: 1,
          },
        },
        {
          id: "Heading3",
          name: "Heading 3",
          basedOn: "Normal",
          next: "Normal",
          quickStyle: true,
          run: { font: FONT, size: 20, bold: true, color: INK },
          paragraph: {
            spacing: { before: 240, after: 100, line: 360 },
            outlineLevel: 2,
          },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_W, height: 16838 },
            margin: { top: 0, bottom: 720, left: 0, right: 0 },
          },
          titlePage: true,
        },
        headers: { default: emptyHeader, first: emptyHeader },
        footers: { default: emptyFooter, first: emptyFooter },
        children: coverSection(),
      },
      {
        properties: {
          page: {
            size: { width: PAGE_W, height: 16838 },
            margin: { top: 1134, bottom: 1134, left: MARGIN, right: MARGIN },
          },
        },
        headers: { default: header },
        footers: { default: footer },
        children: bodyChildren(),
      },
    ],
  });

  const outDir = path.join(__dirname, "docs");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "详细设计说明书.docx");
  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(outPath, buf);
  console.log("Wrote", outPath, "bytes", buf.length);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
