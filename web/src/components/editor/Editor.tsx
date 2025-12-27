import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin'
import { ListNode, ListItemNode } from '@lexical/list'
import { HeadingNode } from '@lexical/rich-text'
import { EditorState } from 'lexical'

const theme = {
  paragraph: 'mb-2',
  heading: {
    h1: 'text-2xl font-bold mb-4',
    h2: 'text-xl font-semibold mb-3',
    h3: 'text-lg font-medium mb-2',
  },
  list: {
    ul: 'list-disc ml-4 mb-2',
    ol: 'list-decimal ml-4 mb-2',
    listitem: 'mb-1',
    listitemChecked: 'line-through text-muted-foreground',
    listitemUnchecked: '',
  },
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
    code: 'font-mono bg-muted px-1 rounded',
  },
}

interface EditorProps {
  initialContent?: string
  onChange?: (content: string) => void
  editable?: boolean
}

export function Editor({ onChange, editable = true }: EditorProps) {
  const initialConfig = {
    namespace: 'NotesEditor',
    theme,
    nodes: [HeadingNode, ListNode, ListItemNode],
    editable,
    onError: (error: Error) => {
      console.error('Lexical error:', error)
    },
  }

  const handleChange = (editorState: EditorState) => {
    editorState.read(() => {
      const json = JSON.stringify(editorState.toJSON())
      onChange?.(json)
    })
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="relative min-h-[200px]">
        <RichTextPlugin
          contentEditable={
            <ContentEditable className="outline-none min-h-[200px] px-4 py-2" />
          }
          placeholder={
            <div className="absolute top-2 left-4 text-muted-foreground pointer-events-none">
              Start typing...
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <ListPlugin />
        <CheckListPlugin />
        <OnChangePlugin onChange={handleChange} />
      </div>
    </LexicalComposer>
  )
}
