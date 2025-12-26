import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useMemo, useEffect } from 'react'
import { Brain, Target, Zap, Calendar, Clock, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { DirectPlanDisplay } from '@/components/direct-plan-display'
import { ParsingStatus } from '@/components/parsing-status'
import { PlanEditor } from '@/components/plan-editor'
import { useForm, type AnyFieldApi } from '@tanstack/react-form'
import { authClient } from '@/lib/auth-client'
import { NotFound } from '@/components/NotFound'

// New Hybrid Flow Components
import { usePlanGeneration, type GenerateInput } from '@/hooks/usePlanGeneration'
import { DraftRecoveryBanner } from '@/components/draft-recovery-banner'
import { AutoSaveIndicator } from '@/components/auto-save-indicator'
import { PlanActionBar } from '@/components/plan-action-bar'

// Validation Schema
import { z } from 'zod'

// Types
import type { MonthlyPlan } from '@/functions/generate-server-fn'

const GeneratePlanFormDataSchema = z.object({
   goalsText: z.string().min(1, 'Goals are required'),
   taskComplexity: z.enum(['Simple', 'Balanced', 'Ambitious']),
   focusAreas: z.string().min(1, 'Focus areas are required'),
   weekendPreference: z.enum(['Work', 'Rest', 'Mixed']),
   fixedCommitmentsJson: z.object({
      commitments: z.array(z.object({
         dayOfWeek: z.string(),
         startTime: z.string(),
         endTime: z.string(),
         description: z.string()
      }))
   })
})

function FieldInfo({ field }: { field: AnyFieldApi }) {
   return (
      <>
         {field.state.meta.isTouched && !field.state.meta.isValid && (
            <p className="text-sm text-red-500">
               {field.state.meta.errors.map((err) => err.message).join(',')}
            </p>
         )}
         {field.state.meta.isValidating && (
            <p className="text-sm text-muted-foreground">Validating...</p>
         )}
      </>
   )
}

export const Route = createFileRoute('/plan')({
   component: RouteComponent,
   notFoundComponent: () => <NotFound />,
})

function RouteComponent() {
   const navigate = useNavigate()

   // Use the new hybrid hook
   const {
      draft,
      planData,
      isGenerating,
      isSaving,
      error: hookError,
      hasDraft,
      generate,
      save,
      discard,
      clearError
   } = usePlanGeneration()

   const [hasGenerated, setHasGenerated] = useState(false)
   const [isEditing, setIsEditing] = useState(false)
   const [editedPlan, setEditedPlan] = useState<MonthlyPlan | undefined>(undefined)
   const [showRecoveryBanner, setShowRecoveryBanner] = useState(false)

   // Sync hook error to local error display
   const error = hookError

   authClient.useSession()

   // Effect to handle draft recovery notification
   useEffect(() => {
      // Only show banner if we have a draft but haven't explicitly "generated" (viewed) it yet
      if (hasDraft && !hasGenerated && draft) {
         setShowRecoveryBanner(true)
      } else {
         setShowRecoveryBanner(false)
      }
   }, [hasDraft, hasGenerated, draft])

   // If generation completes, show the plan
   useEffect(() => {
      if (planData && !hasGenerated && !showRecoveryBanner) {
         setHasGenerated(true)
      }
   }, [planData, showRecoveryBanner])


   // Transform planData (JSON) to MonthlyPlan (Component Model)
   const monthlyPlan = useMemo((): MonthlyPlan | null => {
      if (!planData || !planData.weekly_breakdown) return null

      // Use edited plan if available
      if (editedPlan) return editedPlan

      // Otherwise transform raw data
      const tasks: any[] = []
      const goals: string[] = []

      planData.weekly_breakdown.forEach((week: any) => {
         // Collect goals
         if (week.goals) goals.push(...week.goals)

         // Collect tasks
         if (week.daily_tasks) {
            Object.entries(week.daily_tasks).forEach(([, dayTasks]: [string, any]) => {
               if (Array.isArray(dayTasks)) {
                  dayTasks.forEach((t: any) => {
                     tasks.push({
                        ...t,
                        id: Math.random().toString(36).substring(2, 11),
                        title: t.task_description,
                        description: t.scheduling_reason,
                        category: t.focus_area,
                        priority: t.difficulty_level === 'advanced' ? 'High' :
                           t.difficulty_level === 'moderate' ? 'Medium' : 'Low',
                        status: 'pending'
                     })
                  })
               }
            })
         }
      })

      return {
         id: '0',
         title: planData.monthly_summary ? 'Personalized Monthly Plan' : 'Your Plan',
         month: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
         goals: goals.length > 0 ? goals : ['Complete monthly objectives'],
         tasks,
         totalTasks: tasks.length,
         estimatedHours: tasks.length * 2,
      }
   }, [planData, editedPlan])

   const form = useForm({
      defaultValues: {
         goalsText: '',
         taskComplexity: 'Balanced' as 'Simple' | 'Balanced' | 'Ambitious',
         focusAreas: '',
         weekendPreference: 'Mixed' as 'Work' | 'Rest' | 'Mixed',
         fixedCommitmentsJson: {
            commitments: [] as Array<{
               dayOfWeek: string
               startTime: string
               endTime: string
               description: string
            }>
         }
      },
      validators: {
         onChange: GeneratePlanFormDataSchema,
         onBlur: GeneratePlanFormDataSchema,
      },
      onSubmit: async ({ value }) => {
          clearError()
          setHasGenerated(false)
          setShowRecoveryBanner(false)

           try {
              console.log('[FORM] Raw commitments:', value.fixedCommitmentsJson.commitments)
              // Filter out incomplete commitments (fields not filled)
              const validCommitments = value.fixedCommitmentsJson.commitments.filter(c =>
                c.dayOfWeek && c.startTime && c.endTime && c.description
              )

              const filteredData = {
                 ...value,
                 fixedCommitmentsJson: {
                    commitments: validCommitments
                 }
              }
              console.log('[FORM] Validated commitments:', filteredData.fixedCommitmentsJson.commitments)

             // Call the hybrid generation (auto-stages draft)
             const result = await generate(filteredData as GenerateInput)

            if (result) {
               setHasGenerated(true)
            }

         } catch (err) {
            console.error('Plan generation error:', err)
         }
      }
   })

   const handleRecoverDraft = () => {
      setHasGenerated(true)
      setShowRecoveryBanner(false)
   }

   const handleDiscardDraft = async () => {
      await discard()
      setShowRecoveryBanner(false)
      setHasGenerated(false)
      setEditedPlan(undefined)
      form.reset()
   }

   const handleRegenerate = async () => {
      setHasGenerated(false)
      setEditedPlan(undefined)
      setIsEditing(false)
      // Trigger form submit again
      form.handleSubmit()
   }

   const handleSave = async () => {
      const planId = await save()
      if (planId) {
         alert(`Plan saved successfully! ID: ${planId}`)
         setHasGenerated(false) // Reset view or navigate
      }
   }

   const handleEdit = () => {
      if (monthlyPlan) {
         setIsEditing(true)
         setEditedPlan(monthlyPlan)
      }
   }

   const handleSaveEdit = (newPlanData: MonthlyPlan) => {
      setEditedPlan(newPlanData)
      setIsEditing(false)
   }

   const handleCancelEdit = () => {
      setIsEditing(false)
      setEditedPlan(undefined)
   }

   const handleViewFull = async () => {
      // Save the plan first to persist tasks to database
      const planId = await save()
      if (planId) {
         // Navigate to tasks page
         navigate({ to: '/tasks', search: { planId: planId.toString() } })
      } else {
         // If save failed (no planId), still navigate to tasks page
         navigate({ to: '/tasks' })
      }
   }

   return (
      <div className="min-h-screen bg-background">
         {/* Header */}
         <header className="border-b bg-card">
            <div className="container mx-auto px-4 py-6">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Brain className="h-5 w-5 text-primary" />
                     </div>
                     <div>
                        <h1 className="text-2xl font-bold tracking-tight">Generate AI Plan</h1>
                        <p className="text-muted-foreground">Create a personalized monthly plan with AI assistance</p>
                     </div>
                  </div>

                  {/* Auto-Save Indicator */}
                  <div className="flex items-center gap-4">
                     <AutoSaveIndicator
                        status={isSaving ? 'saving' : hasDraft && !isGenerating ? 'saved' : error ? 'error' : 'idle'}
                        draftKey={draft?.draftKey}
                     />
                  </div>
               </div>
            </div>
         </header>

         {/* Draft Recovery Banner */}
         {showRecoveryBanner && draft && (
            <div className="fixed bottom-6 right-6 z-50 w-full max-w-md">
               <DraftRecoveryBanner
                  createdAt={draft.createdAt}
                  expiresAt={draft.expiresAt}
                  onView={handleRecoverDraft}
                  onDiscard={handleDiscardDraft}
                  onDismiss={() => setShowRecoveryBanner(false)}
               />
            </div>
         )}

         {/* Main Content with Flex Layout */}
         <main className={`container mx-auto px-4 py-8 ${hasGenerated ? 'lg:flex lg:gap-8' : 'max-w-4xl'}`}>
            {/* Form Section - Left side on desktop, full width on mobile */}
            <div className={`${hasGenerated ? 'lg:flex-1' : 'w-full'}`}>
               <form
                  onSubmit={(e) => {
                     e.preventDefault()
                     form.handleSubmit()
                  }}
                  className="space-y-8"
               >
                  {/* Goals Section */}
                  <Card>
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Target className="h-5 w-5" />
                           Your Goals & Objectives
                        </CardTitle>
                        <CardDescription>
                           Describe what you want to achieve this month. Be specific about your goals, deadlines, and desired outcomes.
                        </CardDescription>
                     </CardHeader>
                     <CardContent>
                        <form.Field
                           name="goalsText"
                        >
                           {(field) => (
                              <div className="space-y-2">
                                 <Textarea
                                    value={field.state.value}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder="e.g., I want to launch my e-commerce website, learn React, and exercise 3 times per week. I need to complete the website by end of month and have a job interview scheduled for week 3..."
                                    className="min-h-30 resize-none"
                                 />
                                 <FieldInfo field={field} />
                                 <p className="text-xs text-muted-foreground">
                                    The more detailed your goals, the better AI can tailor your plan.
                                 </p>
                              </div>
                           )}
                        </form.Field>
                     </CardContent>
                  </Card>

                  {/* Task Complexity */}
                  <Card>
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Zap className="h-5 w-5" />
                           Task Complexity
                        </CardTitle>
                        <CardDescription>
                           Choose how ambitious you want your monthly plan to be.
                        </CardDescription>
                     </CardHeader>
                     <CardContent>
                        <form.Field name="taskComplexity">
                           {(field) => (
                              <RadioGroup
                                 value={field.state.value}
                                 onValueChange={(value) => field.handleChange(value as 'Simple' | 'Balanced' | 'Ambitious')}
                                 className="grid grid-cols-1 md:grid-cols-3 gap-4"
                              >
                                 <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="Simple" id="simple" />
                                    <Label htmlFor="simple" className="cursor-pointer">
                                       <div className="font-medium">Simple</div>
                                       <div className="text-sm text-muted-foreground">Fewer, manageable tasks</div>
                                    </Label>
                                 </div>
                                 <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="Balanced" id="balanced" />
                                    <Label htmlFor="balanced" className="cursor-pointer">
                                       <div className="font-medium">Balanced</div>
                                       <div className="text-sm text-muted-foreground">Mix of easy and challenging</div>
                                    </Label>
                                 </div>
                                 <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="Ambitious" id="ambitious" />
                                    <Label htmlFor="ambitious" className="cursor-pointer">
                                       <div className="font-medium">Ambitious</div>
                                       <div className="text-sm text-muted-foreground">Challenging but rewarding</div>
                                    </Label>
                                 </div>
                              </RadioGroup>
                           )}
                        </form.Field>
                     </CardContent>
                  </Card>

                  {/* Focus Areas */}
                  <Card>
                     <CardHeader>
                        <CardTitle>Focus Areas</CardTitle>
                        <CardDescription>
                           What areas do you want to focus on this month?
                        </CardDescription>
                     </CardHeader>
                     <CardContent>
                        <form.Field name="focusAreas">
                           {(field) => (
                              <div className="space-y-2">
                                 <InputGroup>
                                    <InputGroupAddon align="inline-start">
                                       <InputGroupText>
                                          <Target className="h-4 w-4" />
                                       </InputGroupText>
                                    </InputGroupAddon>
                                    <InputGroupInput
                                       value={field.state.value}
                                       onChange={(e) => field.handleChange(e.target.value)}
                                       placeholder="e.g., Health, Career, Learning, Personal Growth"
                                    />
                                 </InputGroup>
                                 <FieldInfo field={field} />
                                 <p className="text-xs text-muted-foreground">
                                    Separate multiple areas with commas.
                                 </p>
                              </div>
                           )}
                        </form.Field>
                     </CardContent>
                  </Card>

                  {/* Weekend Preference */}
                  <Card>
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Calendar className="h-5 w-5" />
                           Weekend Preference
                        </CardTitle>
                        <CardDescription>
                           How would you like to handle weekends in your plan?
                        </CardDescription>
                     </CardHeader>
                     <CardContent>
                        <form.Field name="weekendPreference">
                           {(field) => (
                              <div className="space-y-3">
                                 <RadioGroup
                                    value={field.state.value}
                                    onValueChange={(value) => field.handleChange(value as 'Work' | 'Rest' | 'Mixed')}
                                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                                 >
                                    <div className="flex items-center space-x-2">
                                       <RadioGroupItem value="Work" id="work" />
                                       <Label htmlFor="work" className="cursor-pointer">
                                          <div className="font-medium">Deep Work</div>
                                          <div className="text-sm text-muted-foreground">Focus on intensive tasks</div>
                                       </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                       <RadioGroupItem value="Rest" id="rest" />
                                       <Label htmlFor="rest" className="cursor-pointer">
                                          <div className="font-medium">Rest & Recharge</div>
                                          <div className="text-sm text-muted-foreground">Keep weekends free</div>
                                       </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                       <RadioGroupItem value="Mixed" id="mixed" />
                                       <Label htmlFor="mixed" className="cursor-pointer">
                                          <div className="font-medium">Light Tasks</div>
                                          <div className="text-sm text-muted-foreground">Easy activities only</div>
                                       </Label>
                                    </div>
                                 </RadioGroup>
                                 <FieldInfo field={field} />
                              </div>
                           )}
                        </form.Field>
                     </CardContent>
                  </Card>

                  {/* Fixed Commitments */}
                  <Card>
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Clock className="h-5 w-5" />
                           Fixed Commitments
                        </CardTitle>
                        <CardDescription>
                           Add any regular commitments or blocked time slots (optional).
                        </CardDescription>
                     </CardHeader>
                      <CardContent className="space-y-4">
                         <form.Field name="fixedCommitmentsJson.commitments" mode="array">
                            {(field) => (
                               <>
                                  {field.state.value.map((_, i) => (
                                     <div key={i} className="grid grid-cols-1 md:grid-cols-[140px,120px,120px,1fr,40px] gap-3 p-4 border rounded-lg relative">
                                        <div>
                                          <label className="text-xs text-muted-foreground mb-1 block">Day</label>
                                          <form.Field name={`fixedCommitmentsJson.commitments[${i}].dayOfWeek`}>
                                             {(dayField) => (
                                                <Select
                                                   value={dayField.state.value}
                                                   onValueChange={(value) => dayField.handleChange(value)}
                                                >
                                                   <SelectTrigger>
                                                      <SelectValue placeholder="Day" />
                                                   </SelectTrigger>
                                                   <SelectContent>
                                                      <SelectItem value="Monday">Monday</SelectItem>
                                                      <SelectItem value="Tuesday">Tuesday</SelectItem>
                                                      <SelectItem value="Wednesday">Wednesday</SelectItem>
                                                      <SelectItem value="Thursday">Thursday</SelectItem>
                                                      <SelectItem value="Friday">Friday</SelectItem>
                                                      <SelectItem value="Saturday">Saturday</SelectItem>
                                                      <SelectItem value="Sunday">Sunday</SelectItem>
                                                   </SelectContent>
                                                </Select>
                                             )}
                                          </form.Field>
                                        </div>

                                        <div>
                                          <label className="text-xs text-muted-foreground mb-1 block">Start</label>
                                          <form.Field name={`fixedCommitmentsJson.commitments[${i}].startTime`}>
                                             {(timeField) => (
                                                <InputGroup>
                                                   <InputGroupInput
                                                      type="time"
                                                      value={timeField.state.value}
                                                      onChange={(e) => timeField.handleChange(e.target.value)}
                                                   />
                                                </InputGroup>
                                             )}
                                          </form.Field>
                                        </div>

                                        <div>
                                          <label className="text-xs text-muted-foreground mb-1 block">End</label>
                                          <form.Field name={`fixedCommitmentsJson.commitments[${i}].endTime`}>
                                             {(timeField) => (
                                                <InputGroup>
                                                   <InputGroupInput
                                                      type="time"
                                                      value={timeField.state.value}
                                                      onChange={(e) => timeField.handleChange(e.target.value)}
                                                   />
                                                </InputGroup>
                                             )}
                                          </form.Field>
                                        </div>

                                        <div>
                                          <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                                          <form.Field name={`fixedCommitmentsJson.commitments[${i}].description`}>
                                             {(descField) => (
                                                <Input
                                                   value={descField.state.value}
                                                   onChange={(e) => descField.handleChange(e.target.value)}
                                                   placeholder="e.g., Team standup, Gym workout"
                                                />
                                             )}
                                          </form.Field>
                                        </div>

                                        <div className="flex items-end pb-2">
                                          <Button
                                             type="button"
                                             variant="ghost"
                                             size="icon"
                                             onClick={() => field.removeValue(i)}
                                             className="h-9 w-9 text-muted-foreground hover:text-destructive"
                                          >
                                             <X className="h-4 w-4" />
                                          </Button>
                                        </div>
                                     </div>
                                  ))}

                                  <Button
                                     type="button"
                                     variant="outline"
                                     onClick={() => field.pushValue({
                                        dayOfWeek: '',
                                        startTime: '',
                                        endTime: '',
                                        description: ''
                                     })}
                                     className="w-full"
                                  >
                                     <Plus className="mr-2 h-4 w-4" />
                                     Add Fixed Commitment
                                  </Button>
                               </>
                            )}
                         </form.Field>
                      </CardContent>
                  </Card>

                  {/* Submit Button */}
                  <div className="flex justify-center pt-6">
                     <Button
                        type="submit"
                        size="lg"
                        disabled={isGenerating || form.state.isSubmitting}
                        className="min-w-50"
                     >
                        {isGenerating || form.state.isSubmitting ? (
                           <>
                              <Brain className="mr-2 h-4 w-4 animate-pulse" />
                              Generating Your Plan...
                           </>
                        ) : (
                           <>
                              <Zap className="mr-2 h-4 w-4" />
                              Generate AI Plan
                           </>
                        )}
                     </Button>
                  </div>

                  {/* Form-level Error Display */}
                  {error && (
                     <div className="p-4 border border-red-500 rounded-lg bg-red-50 dark:bg-red-950/20">
                        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                     </div>
                  )}
               </form>
            </div>

            {/* Parsing Status Section - Shows during parsing */}
            {isGenerating && (
               <div className="lg:w-100 lg:sticky lg:top-8 lg:h-fit">
                  <ParsingStatus
                     isLoading={true}
                     aiResponse={null}
                     error={undefined}
                  />
               </div>
            )}

            {/* Edit Mode */}
            {isEditing && editedPlan && (
               <div className="lg:w-100 lg:sticky lg:top-8 lg:h-fit">
                  <PlanEditor
                     monthlyPlan={editedPlan}
                     onSave={handleSaveEdit}
                     onCancel={handleCancelEdit}
                  />
               </div>
            )}

            {/* Direct Plan Display - Shows after parsing is complete */}
            {!isGenerating && monthlyPlan && (
               <div className="lg:w-100 lg:sticky lg:top-8 lg:h-fit">
                  <DirectPlanDisplay
                     isLoading={false}
                     aiResponse={{
                        rawContent: '',
                        metadata: {
                           confidence: 95,
                           detectedFormat: 'json' as const,
                           extractionNotes: 'Plan generated successfully',
                           parsingErrors: [],
                           missingFields: []
                        },
                        structuredData: planData as any
                     }}
                     monthlyPlan={monthlyPlan}
                     error={error || undefined}
                     onRegenerate={handleRegenerate}
                     onSave={handleSave}
                     onEdit={handleEdit}
                     onViewFull={handleViewFull}
                  />
               </div>
            )}
         </main>

         {/* Floating Action Bar */}
         {hasGenerated && monthlyPlan && !isEditing && (
            <PlanActionBar
               onSave={handleSave}
               onDiscard={handleDiscardDraft}
               onRegenerate={handleRegenerate}
               isSaving={isSaving}
               expiresAt={draft?.expiresAt}
            />
         )}
      </div>
   )
}
