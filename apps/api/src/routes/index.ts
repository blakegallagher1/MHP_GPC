import { Router } from 'express';
import { z } from 'zod';
import {
  OwnersService,
  LeadsService,
  DirectMailService,
  DealService,
  FinancialScreeningService,
  ReportService,
  DiligenceService
} from '@mhp-gpc/services';
import {
  DealStage,
  LeadStatus,
  TouchpointType,
  TaskStatus,
  RiskLevel,
  BuyBoxStatus
} from '@prisma/client';

const router = Router();

const ownerInput = z.object({
  name: z.string().min(1),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  mailingStreet: z.string().optional(),
  mailingCity: z.string().optional(),
  mailingState: z.string().optional(),
  mailingZip: z.string().optional()
});

router.post('/owners', async (req, res, next) => {
  try {
    const body = ownerInput.parse(req.body);
    const owner = await OwnersService.createOwner(body);
    res.status(201).json(owner);
  } catch (error) {
    next(error);
  }
});

router.get('/owners', async (req, res, next) => {
  try {
    const owners = await OwnersService.listOwners({ search: req.query.search as string | undefined });
    res.json(owners);
  } catch (error) {
    next(error);
  }
});

const leadInput = z.object({
  parkId: z.string().uuid(),
  source: z.string().min(1),
  status: z.nativeEnum(LeadStatus).optional(),
  assignedTo: z.string().optional()
});

router.post('/leads', async (req, res, next) => {
  try {
    const body = leadInput.parse(req.body);
    const lead = await LeadsService.createLead(body);
    res.status(201).json(lead);
  } catch (error) {
    next(error);
  }
});

const leadQueryInput = z.object({
  status: z.nativeEnum(LeadStatus).optional(),
  stage: z.nativeEnum(DealStage).optional(),
  search: z.string().optional()
});

router.get('/leads', async (req, res, next) => {
  try {
    const query = leadQueryInput.parse(req.query);
    const leads = await LeadsService.listLeads(query);
    res.json(leads);
  } catch (error) {
    next(error);
  }
});

const touchpointInput = z.object({
  type: z.nativeEnum(TouchpointType),
  subject: z.string().min(1),
  notes: z.string().optional(),
  author: z.string().optional()
});

router.post('/leads/:id/touchpoints', async (req, res, next) => {
  try {
    const body = touchpointInput.parse(req.body);
    const touchpoint = await LeadsService.logTouchpoint(
      req.params.id,
      body.type,
      body.subject,
      body.notes,
      body.author
    );
    res.status(201).json(touchpoint);
  } catch (error) {
    next(error);
  }
});

const dealInput = z.object({
  leadId: z.string().uuid(),
  stage: z.nativeEnum(DealStage).optional(),
  offerPrice: z.number().optional(),
  targetCapRate: z.number().optional()
});

router.post('/deals', async (req, res, next) => {
  try {
    const body = dealInput.parse(req.body);
    const deal = await DealService.createDeal(body);
    res.status(201).json(deal);
  } catch (error) {
    next(error);
  }
});

const buyBoxInput = z.object({
  status: z.nativeEnum(BuyBoxStatus),
  notes: z.string().optional(),
  scoreDelta: z.number().int().optional()
});

router.post('/deals/:id/buy-box', async (req, res, next) => {
  try {
    const body = buyBoxInput.parse(req.body);
    const deal = await DealService.updateBuyBoxStatus(req.params.id, body.status, body.notes, body.scoreDelta);
    res.json(deal);
  } catch (error) {
    next(error);
  }
});

router.get('/deals/:id/diligence', async (req, res, next) => {
  try {
    const snapshot = await DiligenceService.getDiligenceSnapshot(req.params.id);
    res.json(snapshot);
  } catch (error) {
    next(error);
  }
});

const checklistItemSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  assignee: z.string().optional()
});

router.post('/deals/:id/diligence/checklist', async (req, res, next) => {
  try {
    const items = z.array(checklistItemSchema).parse(req.body);
    const tasks = await DiligenceService.upsertChecklist(req.params.id, items);
    res.status(201).json(tasks);
  } catch (error) {
    next(error);
  }
});

const taskStatusSchema = z.object({ status: z.nativeEnum(TaskStatus) });

router.patch('/tasks/:id', async (req, res, next) => {
  try {
    const body = taskStatusSchema.parse(req.body);
    const task = await DiligenceService.updateTaskStatus(req.params.id, body.status);
    res.json(task);
  } catch (error) {
    next(error);
  }
});

const riskInput = z.object({
  score: z.number().int(),
  riskLevel: z.nativeEnum(RiskLevel),
  notes: z.string().optional(),
  assessedBy: z.string().optional()
});

router.post('/deals/:id/diligence/risk', async (req, res, next) => {
  try {
    const body = riskInput.parse(req.body);
    const assessment = await DiligenceService.scoreRisk(
      req.params.id,
      body.score,
      body.riskLevel,
      body.notes,
      body.assessedBy
    );
    res.status(201).json(assessment);
  } catch (error) {
    next(error);
  }
});

const scenarioInput = z.object({
  label: z.string().default('scenario'),
  base: z.object({
    dealId: z.string().uuid(),
    pads: z.number().int().positive(),
    currentRent: z.number().positive(),
    expenseRatio: z.number().min(0).max(1),
    otherIncome: z.number().min(0),
    debtService: z.number().positive(),
    purchasePrice: z.number().positive(),
    capRateThreshold: z.number().positive(),
    dscrThreshold: z.number().positive(),
    occupancyFloor: z.number().min(0).max(1),
    insuranceBase: z.number().min(0)
  }),
  scenarios: z.array(
    z.object({
      rentGrowth: z.number(),
      expenseGrowth: z.number(),
      occupancy: z.number().min(0).max(1),
      insuranceIncrease: z.number(),
      rateShockBps: z.number()
    })
  )
});

router.post('/finance/screen', async (req, res, next) => {
  try {
    const body = scenarioInput.parse(req.body);
    const result = await FinancialScreeningService.persistScenarioResults(
      body.base,
      body.scenarios,
      body.label
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

const directMailInput = z.object({
  ownerId: z.string().uuid(),
  templateId: z.string(),
  channel: z.enum(['mail', 'email']),
  metadata: z.record(z.any()).optional()
});

router.post('/direct-mail/send', async (req, res, next) => {
  try {
    const body = directMailInput.parse(req.body);
    const result = await DirectMailService.sendDirectMail(body);
    res.status(202).json(result);
  } catch (error) {
    next(error);
  }
});

const heirInput = z.object({
  ownerId: z.string().uuid(),
  payload: z.record(z.any()),
  consentGranted: z.boolean()
});

router.post('/direct-mail/heir', async (req, res, next) => {
  try {
    const body = heirInput.parse(req.body);
    await DirectMailService.logHeirSourcing(body.ownerId, body.payload, body.consentGranted);
    res.status(201).json({ status: 'recorded' });
  } catch (error) {
    next(error);
  }
});

router.get('/reports/executive', async (_req, res, next) => {
  try {
    const report = await ReportService.buildExecutiveDashboard();
    res.json(report);
  } catch (error) {
    next(error);
  }
});

router.get('/reports/deals/:id', async (req, res, next) => {
  try {
    const [sheet, binder] = await Promise.all([
      ReportService.buildAcquisitionSheet(req.params.id),
      ReportService.buildDDBinder(req.params.id)
    ]);
    res.json({ sheet, binder });
  } catch (error) {
    next(error);
  }
});

export default router;
