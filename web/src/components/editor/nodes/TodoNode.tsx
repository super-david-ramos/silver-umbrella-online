import {
  DecoratorNode,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical'

export type SerializedTodoNode = Spread<
  {
    text: string
    checked: boolean
  },
  SerializedLexicalNode
>

export class TodoNode extends DecoratorNode<JSX.Element> {
  __text: string
  __checked: boolean

  static getType(): string {
    return 'todo'
  }

  static clone(node: TodoNode): TodoNode {
    return new TodoNode(node.__text, node.__checked, node.__key)
  }

  constructor(text: string, checked: boolean = false, key?: NodeKey) {
    super(key)
    this.__text = text
    this.__checked = checked
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const div = document.createElement('div')
    div.className = 'flex items-start gap-2 py-1'
    return div
  }

  updateDOM(): false {
    return false
  }

  static importJSON(serializedNode: SerializedTodoNode): TodoNode {
    return new TodoNode(serializedNode.text, serializedNode.checked)
  }

  exportJSON(): SerializedTodoNode {
    return {
      type: 'todo',
      version: 1,
      text: this.__text,
      checked: this.__checked,
    }
  }

  setChecked(checked: boolean): void {
    const writable = this.getWritable()
    writable.__checked = checked
  }

  setText(text: string): void {
    const writable = this.getWritable()
    writable.__text = text
  }

  decorate(): JSX.Element {
    return (
      <TodoComponent
        text={this.__text}
        checked={this.__checked}
        nodeKey={this.__key}
      />
    )
  }
}

function TodoComponent({
  text,
  checked,
}: {
  text: string
  checked: boolean
  nodeKey: NodeKey
}) {
  return (
    <div className="flex items-start gap-2 py-1">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => {}}
        className="mt-1 h-4 w-4 rounded border-gray-300"
      />
      <span className={checked ? 'line-through text-muted-foreground' : ''}>
        {text}
      </span>
    </div>
  )
}

export function $createTodoNode(text: string, checked: boolean = false): TodoNode {
  return new TodoNode(text, checked)
}

export function $isTodoNode(node: LexicalNode | null | undefined): node is TodoNode {
  return node instanceof TodoNode
}
