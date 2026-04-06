/**
 * MMS Execution Engine
 * Core simulation logic for maintenance workflows
 */

import { supabase } from '../../lib/supabase';

// Role hierarchy for validation
const ROLE_HIERARCHY = {
  MANAGER: 7,
  ENGINEER: 6,
  CHEF_D_ATELIER: 5,
  SOUS_CHEF_D_ATELIER: 4,
  CHEF_D_EQUIPE: 3,
  TECHNICIEN_LEAD: 2,
  TECHNICIEN_EXECUTIF: 1
};

// Service compatibility rules
const SERVICE_RULES = {
  INSPECTION: {
    canInspect: true,
    canAnalyze: true,
    canCreateWorkOrder: true,
    canAssign: false,
    canExecute: false
  },
  PRODUCTION: {
    canReportIssue: true,
    canAssign: false,
    canExecute: false
  },
  MAINTENANCE_MECHANICAL: {
    canAssign: true,
    canExecute: true
  },
  MAINTENANCE_ELECTRICAL_REGULATION: {
    canAssign: true,
    canExecute: true
  }
};

/**
 * Validate if a user can perform an action based on RBAC
 */
export function validateRBAC(userRole, userPermissions, requiredAction) {
  return userPermissions.some(perm => perm.action === requiredAction);
}

/**
 * Validate service match between user and step requirement
 */
export function validateServiceMatch(userService, stepService) {
  // INSPECTION service can only do inspection-related actions
  if (userService === 'INSPECTION' && stepService === 'INSPECTION') {
    return true;
  }
  
  // For maintenance services, exact match required
  return userService === stepService;
}

/**
 * Validate specialization if required
 */
export function validateSpecialization(userSpecialization, stepSpecialization) {
  // If step doesn't require specialization, any user is fine
  if (!stepSpecialization) {
    return true;
  }
  
  // If step requires specialization, user must have it
  return userSpecialization === stepSpecialization;
}

/**
 * Validate hierarchy level for assignment actions
 */
export function validateHierarchy(userRole, targetRole) {
  const userLevel = ROLE_HIERARCHY[userRole];
  const targetLevel = ROLE_HIERARCHY[targetRole];
  
  // Chef d'équipe can only assign downward
  if (userRole === 'CHEF_D_EQUIPE') {
    return userLevel > targetLevel;
  }
  
  return true;
}

/**
 * Main execution engine class
 */
export class ExecutionEngine {
  constructor() {
    this.executionId = null;
    this.scenario = null;
    this.currentUser = null;
    this.timelineEvents = [];
  }

  /**
   * Initialize execution with scenario and user
   */
  async initialize(scenarioId, userId) {
    try {
      // Fetch scenario
      const { data: scenario, error: scenarioError } = await supabase
        .from('mms_scenarios')
        .select('*')
        .eq('id', scenarioId)
        .single();

      if (scenarioError || !scenario) {
        throw new Error('Scénario non trouvé');
      }

      // Fetch user with permissions
      const { data: user, error: userError } = await supabase
        .from('mms_users')
        .select(`
          *,
          permissions:mms_role_permissions(*)
        `)
        .eq('id', userId)
        .single();

      if (userError || !user) {
        throw new Error('Utilisateur non trouvé');
      }

      this.scenario = scenario;
      this.currentUser = user;
      
      // Parse steps from JSON
      const steps = typeof scenario.steps === 'string' 
        ? JSON.parse(scenario.steps) 
        : scenario.steps;
      
      // Create execution record
      const { data: execution, error: execError } = await supabase
        .from('mms_executions')
        .insert({
          scenario_id: scenarioId,
          user_id: userId,
          status: 'running',
          current_step: 0,
          total_steps: steps.length
        })
        .select()
        .single();

      if (execError) {
        throw new Error('Échec création exécution');
      }

      this.executionId = execution.id;
      return { success: true, execution };
    } catch (error) {
      console.error('Initialization error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute a single step with full validation
   */
  async executeStep(stepIndex, step) {
    const { actor, service, action, specialization } = step;
    
    // Build validation result object
    const validationResult = {
      step_index: stepIndex,
      actor_role: actor,
      actor_service: service,
      actor_specialization: specialization || null,
      action: action,
      timestamp: new Date().toISOString(),
      metadata: {}
    };

    // Check if we need to simulate a different user for this step
    // In real scenario, each step would be performed by appropriate role
    // For simulation, we check if the action is valid for the defined actor
    
    // Fetch a user matching the step's actor role and service
    const { data: stepActor, error: actorError } = await supabase
      .from('mms_users')
      .select(`
        *,
        permissions:mms_role_permissions(*)
      `)
      .eq('role', actor)
      .eq('service', service)
      .is('specialization', specialization ? specialization : null)
      .limit(1)
      .maybeSingle();

    if (actorError || !stepActor) {
      // Try without specialization filter
      const { data: fallbackActor } = await supabase
        .from('mms_users')
        .select(`
          *,
          permissions:mms_role_permissions(*)
        `)
        .eq('role', actor)
        .eq('service', service)
        .limit(1)
        .maybeSingle();

      if (!fallbackActor) {
        validationResult.status = 'rejected';
        validationResult.validation = 'denied';
        validationResult.message = `Aucun utilisateur trouvé pour le rôle ${actor} dans le service ${service}`;
        return validationResult;
      }
      
      validationResult.actor_specialization = fallbackActor.specialization;
    }

    const executingUser = stepActor || fallbackActor;
    validationResult.metadata.user_id = executingUser.id;
    validationResult.metadata.user_name = executingUser.name;

    // RBAC Validation
    const hasPermission = validateRBAC(
      executingUser.role,
      executingUser.permissions || [],
      action
    );

    if (!hasPermission) {
      validationResult.status = 'rejected';
      validationResult.validation = 'denied';
      validationResult.message = `Permission refusée: ${action} n'est pas autorisé pour le rôle ${actor}`;
      return validationResult;
    }

    // Service Match Validation
    const serviceMatch = validateServiceMatch(executingUser.service, service);
    if (!serviceMatch) {
      validationResult.status = 'rejected';
      validationResult.validation = 'denied';
      validationResult.message = `Incompatibilité de service: ${executingUser.service} ne peut pas exécuter des actions pour ${service}`;
      return validationResult;
    }

    // Specialization Validation (if required)
    if (specialization) {
      const specMatch = validateSpecialization(executingUser.specialization, specialization);
      if (!specMatch) {
        validationResult.status = 'rejected';
        validationResult.validation = 'denied';
        validationResult.message = `Spécialisation requise: ${specialization} nécessaire, utilisateur a ${executingUser.specialization || 'aucune'}`;
        return validationResult;
      }
    }

    // All validations passed
    validationResult.status = 'success';
    validationResult.validation = 'allowed';
    validationResult.message = `✓ ${this.getActionLabel(action)} exécuté par ${executingUser.name} (${actor})`;

    return validationResult;
  }

  /**
   * Get human-readable action label in French
   */
  getActionLabel(action) {
    const labels = {
      report_issue: 'Signaler un problème',
      inspect_condition: 'Inspecter l\'état',
      analyze_issue: 'Analyser le problème',
      analyze_failure: 'Analyser la panne',
      create_work_order: 'Créer un ordre de travail',
      approve_work_order: 'Approuver l\'ordre de travail',
      assign_work_order: 'Assigner l\'ordre de travail',
      execute_task: 'Exécuter la tâche',
      validate_execution: 'Valider l\'exécution',
      view_all_work_orders: 'Voir tous les ordres',
      manage_subscription: 'Gérer l\'abonnement',
      auto_approve: 'Approbation automatique',
      view_own_tasks: 'Voir mes tâches',
      create_preventive_plan: 'Créer un plan préventif'
    };
    return labels[action] || action;
  }

  /**
   * Run full scenario execution
   */
  async runScenario(onProgress) {
    if (!this.scenario || !this.executionId) {
      throw new Error('Exécution non initialisée');
    }

    const steps = typeof this.scenario.steps === 'string'
      ? JSON.parse(this.scenario.steps)
      : this.scenario.steps;

    let allSuccess = true;
    this.timelineEvents = [];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      // Simulate delay for UX (300-800ms)
      const delay = Math.floor(Math.random() * 500) + 300;
      await new Promise(resolve => setTimeout(resolve, delay));

      // Execute step
      const result = await this.executeStep(i + 1, step);
      this.timelineEvents.push(result);

      // Notify progress
      if (onProgress) {
        onProgress({
          currentStep: i + 1,
          totalSteps: steps.length,
          lastEvent: result
        });
      }

      // Save timeline event to database
      await supabase.from('mms_timeline_events').insert({
        execution_id: this.executionId,
        step_index: result.step_index,
        actor_role: result.actor_role,
        actor_service: result.actor_service,
        actor_specialization: result.actor_specialization,
        action: result.action,
        status: result.status,
        validation: result.validation,
        message: result.message,
        metadata: result.metadata
      });

      // FAILURE RULE: Stop execution on first rejection
      if (result.status === 'rejected') {
        allSuccess = false;
        
        // Update execution status
        await supabase
          .from('mms_executions')
          .update({
            status: 'rejected',
            current_step: i + 1,
            completed_at: new Date().toISOString(),
            error_message: result.message
          })
          .eq('id', this.executionId);

        break;
      }
    }

    // Mark execution as completed if all steps succeeded
    if (allSuccess) {
      await supabase
        .from('mms_executions')
        .update({
          status: 'completed',
          current_step: steps.length,
          completed_at: new Date().toISOString()
        })
        .eq('id', this.executionId);
    }

    return {
      success: allSuccess,
      executionId: this.executionId,
      events: this.timelineEvents
    };
  }

  /**
   * Get timeline events for an execution
   */
  static async getTimeline(executionId) {
    const { data, error } = await supabase
      .from('mms_timeline_events')
      .select('*')
      .eq('execution_id', executionId)
      .order('step_index', { ascending: true });

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Get execution details
   */
  static async getExecution(executionId) {
    const { data, error } = await supabase
      .from('mms_executions')
      .select(`
        *,
        scenario:mms_scenarios(name, trigger_type)
      `)
      .eq('id', executionId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }
}

export default ExecutionEngine;
