import express from 'express';
// import dotenv from '';
// dotenv.config();

const port = Number(process.env.PORT) || 3000;
const expenseClientEmailKey = 'expense-client-email-id';
const app = express();

app.use(express.json({ limit: '1mb' }));

app.use((request, response, next) => {
    response.set('Access-Control-Allow-Origin', '*');
    response.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.set('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') {
        return response.sendStatus(204);
    }

    next();
});

function makeExpenses(request) {
    const start = request['from-date'];
    const end = request['to-date'];
    const duration = end - start;
    const clientEmail = request[expenseClientEmailKey];
    const clientSeed = [...clientEmail.toLowerCase()].reduce(
        (seed, character) => (seed * 31 + character.charCodeAt(0)) >>> 0,
        7,
    );
    const invoiceDates = [
        start + Math.floor(duration * 0.2),
        start + Math.floor(duration * 0.55),
        start + Math.floor(duration * 0.85),
    ];
    const travelRecords = [
        { type: 'FLIGHT', vendor: 'Air India', city: 'Mumbai', amount: 12500 },
        { type: 'HOTEL', vendor: 'Taj Hotels', city: 'Bengaluru', amount: 9800 },
        { type: 'CAB', vendor: 'Meru Cabs', city: 'New Delhi', amount: 1575 },
        { type: 'BUS', vendor: 'RedBus', city: 'Pune', amount: 850 },
        { type: 'TRAIN', vendor: 'Indian Railways', city: 'Kolkata', amount: 2450 },
        { type: 'WALLET', vendor: 'MMT Wallet', city: 'Hyderabad', amount: 3200 },
    ];
    const employees = ['Aarav Sharma', 'Mira Das', 'Rohan Sen'];

    return travelRecords.map((record, index) => ({
        'invoice-id': `MOCK-${record.type}-${clientSeed.toString(36).toUpperCase()}-${String(index + 1).padStart(4, '0')}`,
        'travel-type': record.type,
        'client-email': clientEmail,
        'employee-name': employees[(index + clientSeed) % employees.length],
        'employee-email': `employee${index + 1}.${clientSeed.toString(36)}@example.com`,
        'vendor-name': record.vendor,
        'invoice-date': invoiceDates[index % invoiceDates.length],
        'report-type': request['report-type'],
        level: request.level,
        amount: record.amount + ((clientSeed + index * 977) % 1500),
        currency: 'INR',
        city: record.city,
    }));
}

app.post('/trackmmt/expenses', (request, response) => {
    const input = request.body;
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        return response.status(400).json({ success: false, message: 'Request body must be a JSON object' });
    }

    const clientEmail = input[expenseClientEmailKey] ?? input['expense-client-emaiid'];
    const { 'external-org-id': organizationId, 'from-date': fromDate, 'to-date': toDate } = input;
    const { 'report-type': reportType, level } = input;

    if (!clientEmail || !organizationId || !reportType || !level
        || !Number.isFinite(fromDate) || !Number.isFinite(toDate)) {
        return response.status(400).json({
            success: false,
            message: 'Required fields: expense-client-email-id, external-org-id, from-date, to-date, report-type, level',
        });
    }

    if (fromDate > toDate) {
        return response.status(400).json({
            success: false,
            message: 'from-date must be earlier than or equal to to-date',
        });
    }

    const normalizedRequest = {
        [expenseClientEmailKey]: clientEmail,
        'external-org-id': organizationId,
        'from-date': fromDate,
        'to-date': toDate,
        'report-type': reportType,
        level,
    };

    return response.json({
        success: true,
        request: normalizedRequest,
        data: makeExpenses(normalizedRequest),
    });
});

app.use((error, request, response, next) => {
    const status = error.status || 400;
    response.status(status).json({
        success: false,
        message: status === 413 ? 'Request body is too large' : 'Request body must be valid JSON',
    });
});

app.listen(port, (error) => {
    if (error) {
        console.log("An error occured while starting the server", error);
    }
    console.log(`MMT Expenses mock API listening on http://localhost:${port}`);
});
