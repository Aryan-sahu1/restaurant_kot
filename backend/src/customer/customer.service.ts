import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { Customer } from './entities/customer.entity';

@Injectable()
export class CustomerService {
	constructor(
		@InjectRepository(Customer)
		private readonly customerRepository: Repository<Customer>,
	) {}

	findAll() {
		return this.customerRepository.find({
			order: { id: 'DESC' },
		});
	}

	async create(createCustomerDto: CreateCustomerDto) {
		const customer = this.customerRepository.create({
			name: createCustomerDto.name?.trim() || null,
		});

		return this.customerRepository.save(customer);
	}

	async remove(id: number) {
		await this.customerRepository.delete(id);
		return { message: 'Customer deleted successfully' };
	}
}
