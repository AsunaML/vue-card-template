export type ChatMessage = {
  message_id: number;
  name: string;
  role: 'system' | 'assistant' | 'user';
  is_hidden: boolean;
  message: string;
  data: Record<string, any>;
  extra: Record<string, any>;
};

export type ChatMessageSwiped = {
  message_id: number;
  name: string;
  role: 'system' | 'assistant' | 'user';
  is_hidden: boolean;
  swipe_id: number;
  swipes: string[];
  swipes_data: Record<string, any>[];
  swipes_info: Record<string, any>[];
};

export type GetChatMessagesOption = {
  /** 按 role 筛选消息; 默认为 `'all'` */
  role?: 'all' | 'system' | 'assistant' | 'user';
  /** 按是否被隐藏筛选消息; 默认为 `'all'` */
  hide_state?: 'all' | 'hidden' | 'unhidden';
  /** 是否包含未被 ai 使用的消息页信息, 如没选择的开局、通过点击箭头重 roll 的楼层. 如果不包含则返回类型为 `ChatMessage`, 否则返回类型为 `ChatMessageSwiped`; 默认为 `false` */
  include_swipes?: boolean;
};

export type SetChatMessagesOption = {
  /**
   * 是否更新楼层在页面上的显示, 只会更新已经被加载在网页上的楼层, 并触发被更新楼层的 "仅格式显示" 正则; 默认为 `'affected'`
   * - `'none'`: 不更新页面的显示
   * - `'affected'`: 仅更新被影响楼层的显示, 更新显示时会发送 `tavern_events.USER_MESSAGE_RENDERED` 或 `tavern_events.CHARACTER_MESSAGE_RENDERED` 事件
   * - `'all'`: 重新载入整个聊天消息, 将会触发 `tavern_events.CHAT_CHANGED` 事件
   */
  refresh?: 'none' | 'affected' | 'all';
}

export type ChatMessageCreating = {
  name?: string;
  role: 'system' | 'assistant' | 'user';
  is_hidden?: boolean;
  message: string;
  data?: Record<string, any>;
}

export type CreateChatMessagesOption = {
  /** 插入到指定楼层前或末尾; 默认为末尾 */
  insert_at?: number | 'end';

  /**
   * 是否更新楼层在页面上的显示, 只会更新已经被加载在网页上的楼层, 并触发被更新楼层的 "仅格式显示" 正则; 默认为 `'affected'`
   * - `'none'`: 不更新页面的显示
   * - `'affected'`: 仅更新被影响楼层的显示
   * - `'all'`: 重新载入整个聊天消息, 将会触发 `tavern_events.CHAT_CHANGED` 事件
   */
  refresh?: 'none' | 'affected' | 'all';
}

export type DeleteChatMessagesOption = {
  /**
   * 是否更新楼层在页面上的显示, 只会更新已经被加载在网页上的楼层, 并触发被更新楼层的 "仅格式显示" 正则; 默认为 `'all'`
   * - `'none'`: 不更新页面的显示
   * - `'all'`: 重新载入整个聊天消息, 将会触发 `tavern_events.CHAT_CHANGED` 事件
   */
  refresh?: 'none' | 'all';
}

export type RotateChatMessagesOption = {
  /**
   * 是否更新楼层在页面上的显示, 只会更新已经被加载在网页上的楼层, 并触发被更新楼层的 "仅格式显示" 正则; 默认为 `'all'`
   * - `'none'`: 不更新页面的显示
   * - `'all'`: 重新载入整个聊天消息, 将会触发 `tavern_events.CHAT_CHANGED` 事件
   */
  refresh?: 'none' | 'all';
}
