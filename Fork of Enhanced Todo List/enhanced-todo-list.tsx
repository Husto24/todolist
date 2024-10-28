'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Plus, Trash2, Settings, CheckCircle2, Circle, Calendar as CalendarIcon, Paperclip, X, Download, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast, useToast } from "@/components/ui/use-toast"

interface Todo {
  id: number
  text: string
  originalCategory: string
  priority: 'low' | 'medium' | 'high'
  dueDate?: Date
  note?: string
  file?: File
}

interface TaskCategory {
  id: string
  name: string
  todos: Todo[]
}

interface Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
}

const InteractiveBackground = ({ darkMode }: { darkMode: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [particles, setParticles] = useState<Particle[]>([])
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        })
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const createParticles = () => {
      const particlesArray: Particle[] = []
      const numberOfParticles = 100

      for (let i = 0; i < numberOfParticles; i++) {
        const size = Math.random() * 5 + 1
        const x = Math.random() * dimensions.width
        const y = Math.random() * dimensions.height
        const speedX = Math.random() * 3 - 1.5
        const speedY = Math.random() * 3 - 1.5
        particlesArray.push({ x, y, size, speedX, speedY })
      }

      setParticles(particlesArray)
    }

    createParticles()
  }, [dimensions])

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const animate = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height)

      particles.forEach((particle, index) => {
        particle.x += particle.speedX
        particle.y += particle.speedY

        if (particle.x > dimensions.width) particle.x = 0
        else if (particle.x < 0) particle.x = dimensions.width

        if (particle.y > dimensions.height) particle.y = 0
        else if (particle.y < 0) particle.y = dimensions.height

        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        ctx.fill()
      })

      requestAnimationFrame(animate)
    }

    animate()
  }, [particles, dimensions, darkMode])

  return (
    <canvas
      ref={canvasRef}
      width={dimensions.width}
      height={dimensions.height}
      className="fixed top-0 left-0 w-full h-full pointer-events-none"
    />
  )
}

const FilePreview = ({ file }: { file: File }) => {
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else if (file.type === 'application/pdf') {
      setPreview(URL.createObjectURL(file))
    }

    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [file])

  if (!preview) {
    return <div>No preview available</div>
  }

  if (file.type.startsWith('image/')) {
    return <img src={preview} alt="File preview" className="max-w-full h-auto" />
  }

  if (file.type === 'application/pdf') {
    return (
      <iframe
        src={preview}
        title="PDF preview"
        width="100%"
        height="500px"
        className="border-0"
      />
    )
  }

  return <div>Unsupported file type</div>
}

export default function Component() {
  const [categories, setCategories] = useState<TaskCategory[]>([
    { id: 'personal', name: 'Personal', todos: [] },
    { id: 'work', name: 'Work', todos: [] },
    { id: 'completed', name: 'Completed', todos: [] },
  ])
  const [activeCategory, setActiveCategory] = useState('personal')
  const [newTodo, setNewTodo] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [darkMode, setDarkMode] = useState(false)
  const [newTodoPriority, setNewTodoPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [newTodoDueDate, setNewTodoDueDate] = useState<Date | undefined>(undefined)
  const [newTodoNote, setNewTodoNote] = useState('')
  const [newTodoFile, setNewTodoFile] = useState<File | null>(null)
  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const addTodo = () => {
    if (newTodo.trim() !== '') {
      setCategories(categories.map(category => 
        category.id === activeCategory
          ? { ...category, todos: [...category.todos, { 
              id: Date.now(), 
              text: newTodo, 
              originalCategory: activeCategory, 
              priority: newTodoPriority, 
              dueDate: newTodoDueDate,
              note: newTodoNote,
              file: newTodoFile || undefined
            }] }
          : category
      ))
      setNewTodo('')
      setNewTodoPriority('medium')
      setNewTodoDueDate(undefined)
      setNewTodoNote('')
      setNewTodoFile(null)
      toast({
        title: "Task added",
        description: "Your new task has been added successfully.",
      })
    }
  }

  const toggleTodo = (todoId: number, isCompleted: boolean) => {
    const sourceCategory = isCompleted ? 'completed' : categories.find(c => c.todos.some(t => t.id === todoId))?.id
    const targetCategory = isCompleted ? categories.find(c => c.todos.some(t => t.id === todoId))?.todos.find(t => t.id === todoId)?.originalCategory : 'completed'

    if (sourceCategory && targetCategory) {
      setCategories(categories.map(category => {
        if (category.id === sourceCategory) {
          return { ...category, todos: category.todos.filter(todo => todo.id !== todoId) }
        }
        if (category.id === targetCategory) {
          const todoToMove = categories.find(c => c.id === sourceCategory)?.todos.find(t => t.id === todoId)
          return todoToMove ? { ...category, todos: [...category.todos, todoToMove] } : category
        }
        return category
      }))
      toast({
        title: isCompleted ? "Task marked as incomplete" : "Task completed",
        description: `The task has been moved to ${isCompleted ? 'its original category' : 'completed tasks'}.`,
      })
    }
  }

  const removeTodo = (categoryId: string, todoId: number) => {
    setCategories(categories.map(category => 
      category.id === categoryId
        ? { ...category, todos: category.todos.filter(todo => todo.id !== todoId) }
        : category
    ))
    toast({
      title: "Task removed",
      description: "The task has been removed successfully.",
      variant: "destructive",
    })
  }

  const addCategory = () => {
    if (newCategory.trim() !== '' && !categories.some(c => c.id === newCategory.toLowerCase())) {
      setCategories([...categories, { id: newCategory.toLowerCase(), name: newCategory, todos: [] }])
      setNewCategory('')
      toast({
        title: "Category added",
        description: `New category "${newCategory}" has been added.`,
      })
    }
  }

  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'low': return 'text-gray-500'
      case 'medium': return 'text-yellow-500'
      case 'high': return 'text-red-500'
      default: return ''
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 5MB.",
          variant: "destructive",
        })
        return
      }
      setNewTodoFile(file)
      toast({
        title: "File attached",
        description: `File "${file.name}" has been attached to the task.`,
      })
    }
  }

  const removeFile = () => {
    setNewTodoFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    toast({
      title: "File removed",
      description: "The attached file has been removed.",
    })
  }

  const downloadFile = (file: File) => {
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast({
      title: "File downloaded",
      description: `File "${file.name}" has been downloaded.`,
    })
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''} bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900`}>
      <InteractiveBackground darkMode={darkMode} />
      <div className="container mx-auto p-4 transition-colors duration-300 relative z-10">
        <Card className="w-full max-w-2xl mx-auto shadow-lg backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
          <CardContent className="p-6 rounded-lg">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                  className="ml-4"
                  aria-label="Toggle dark mode"
                >
                  {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </Switch>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" className="shadow-sm">
                      <Settings className="h-4 w-4" />
                      <span className="sr-only">Open settings</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Category</DialogTitle>
                    </DialogHeader>
                    <div className="flex space-x-2 mt-4">
                      <Input
                        type="text"
                        placeholder="New category name"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="flex-grow"
                      />
                      <Button onClick={addCategory}>Add</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.filter(category => category.id !== 'completed').map(category => (
                <Button
                  key={category.id}
                  variant={activeCategory === category.id ? "default" : "outline"}
                  onClick={() => setActiveCategory(category.id)}
                  className="px-3 py-1 text-sm shadow-sm"
                >
                  {category.name}
                </Button>
              ))}
            </div>
            {activeCategory !== 'completed' && (
              <div className="flex flex-col space-y-2 mb-4">
                <Input
                  type="text"
                  placeholder={`Add a new ${categories.find(c => c.id === activeCategory)?.name.toLowerCase()} task`}
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTodo()}
                  className="flex-grow shadow-sm"
                />
                <div className="flex  space-x-2">
                  <Select value={newTodoPriority} onValueChange={(value: 'low' | 'medium' | 'high') => setNewTodoPriority(value)}>
                    <SelectTrigger className="w-[180px] shadow-sm">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                    </SelectContent>
                  </Select>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[180px] justify-start text-left font-normal shadow-sm">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newTodoDueDate ? format(newTodoDueDate, 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newTodoDueDate}
                        onSelect={setNewTodoDueDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <Textarea
                  placeholder="Add a note (optional)"
                  value={newTodoNote}
                  onChange={(e) => setNewTodoNote(e.target.value)}
                  className="min-h-[100px] shadow-sm"
                />
                <div className="flex items-center space-x-2">
                  <Input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    ref={fileInputRef}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="shadow-sm"
                  >
                    <Paperclip className="mr-2 h-4 w-4" />
                    Attach File
                  </Button>
                  {newTodoFile && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{newTodoFile.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={removeFile}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <Button onClick={addTodo} className="shadow-sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Task
                </Button>
              </div>
            )}
            <AnimatePresence>
              {categories.find(c => c.id === activeCategory)?.todos.map(todo => (
                <motion.div
                  key={todo.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col space-y-2 mb-4 p-4 border rounded-md shadow-sm bg-gray-50/80 dark:bg-gray-700/80 backdrop-blur-sm"
                >
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleTodo(todo.id, activeCategory === 'completed')}
                      aria-label={activeCategory === 'completed' ? "Mark as incomplete" : "Mark as complete"}
                    >
                      {activeCategory === 'completed' ? (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </Button>
                    <span className={`flex-grow ${getPriorityColor(todo.priority)}`}>{todo.text}</span>
                    {todo.dueDate && (
                      <span className="text-sm text-muted-foreground">
                        {format(todo.dueDate, 'MMM d')}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTodo(activeCategory, todo.id)}
                      aria-label="Remove task"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {todo.note && (
                    <p className="text-sm text-muted-foreground">{todo.note}</p>
                  )}
                  {todo.file && (
                    <div className="flex items-center space-x-2">
                      <Paperclip className="h-4 w-4" />
                      <span className="text-sm">{todo.file.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => downloadFile(todo.file!)}
                        aria-label="Download file"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Preview file"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>File Preview: {todo.file.name}</DialogTitle>
                          </DialogHeader>
                          <FilePreview file={todo.file} />
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {categories.find(c => c.id === activeCategory)?.todos.length === 0 && (
              <p className="text-center text-muted-foreground">No tasks in this category</p>
            )}
            {activeCategory !== 'completed' && (
              <div className="mt-6">
                <Button
                  variant="outline"
                  onClick={() => setActiveCategory('completed')}
                  className="w-full shadow-sm"
                >
                  View Completed Tasks
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}