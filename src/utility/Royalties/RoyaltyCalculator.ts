import {TriDB} from "../DB/TriDB.js";
import {Expense} from "../../models/db/finance/Expense.js";

export class RoyaltyCalculator {
    private readonly db: TriDB;

    constructor(db: TriDB) {
        this.db = db;
    }

    async getExpenses(year: number, month: number): Promise<Expense[]> {
        return await this.db.getExpensesForMonth(year, month);
    }

    async calculateRoyalties(year: number, month: number) {
        const expenses = await this.getExpenses(year, month);
        console.log(expenses);

        
    }
}