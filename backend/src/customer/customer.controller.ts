import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CustomerService } from './customer.service';

@Controller('customer')
export class CustomerController {
	constructor(private readonly customerService: CustomerService) {}

	@Get()
	findAll() {
		return this.customerService.findAll();
	}

	@Post()
	create(@Body() createCustomerDto: CreateCustomerDto) {
		return this.customerService.create(createCustomerDto);
	}

	@Delete(':id')
	remove(@Param('id', ParseIntPipe) id: number) {
		return this.customerService.remove(id);
	}
}
